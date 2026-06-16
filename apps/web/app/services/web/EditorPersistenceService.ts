import { and, asc, desc, eq, inArray, isNull, lte, max } from "drizzle-orm";
import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import type {
  EditorNote,
  IEditorPersistenceService,
  NoteContent,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { Select } from "@basalt/domain";
import {
  noteOperationsTable,
  noteSnapshotsTable,
  notes as editorNotes,
} from "@basalt/db/schema";
import { compress, decompress } from "./compression";

type SqlMethod = "all" | "get" | "values" | "run";

type QueryResult = { rows: unknown[] | unknown[][] };

type WorkerReq =
  | {
      reqId: number;
      kind: "query";
      sql: string;
      params: unknown[];
      method: SqlMethod;
    }
  | {
      reqId: number;
      kind: "batch";
      queries: { sql: string; params: unknown[]; method: SqlMethod }[];
    }
  | {
      reqId: number;
      kind: "reset";
    }
  | {
      reqId: number;
      kind: "create-note-tables";
      noteId: string;
    }
  | {
      reqId: number;
      kind: "drop-note-tables";
      noteId: string;
    };

type WorkerRes =
  | { reqId: number; ok: true; data: QueryResult | QueryResult[] }
  | { reqId: number; ok: false; error: string };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type SendReq = DistributiveOmit<WorkerReq, "reqId">;

class WorkerClient {
  private worker: Worker;
  private nextReqId = 1;
  private pending = new Map<
    number,
    { resolve: (v: QueryResult | QueryResult[]) => void; reject: (e: unknown) => void }
  >();

  constructor() {
    this.worker = new Worker(
      new URL("./editor-db.worker.ts", import.meta.url),
      { type: "module" },
    );
    this.worker.onmessage = (e: MessageEvent<WorkerRes>) => {
      const res = e.data;
      const pending = this.pending.get(res.reqId);
      if (!pending) return;
      this.pending.delete(res.reqId);
      if (res.ok) pending.resolve(res.data);
      else pending.reject(new Error(res.error));
    };
  }

  send(req: SendReq): Promise<QueryResult | QueryResult[]> {
    const reqId = this.nextReqId++;
    return new Promise((resolve, reject) => {
      this.pending.set(reqId, { resolve, reject });
      this.worker.postMessage({ ...req, reqId } as WorkerReq);
    });
  }
}

function makeDb(client: WorkerClient): SqliteRemoteDatabase {
  return drizzle(
    async (sql, params, method) => {
      const res = (await client.send({
        kind: "query",
        sql,
        params,
        method: method as SqlMethod,
      })) as QueryResult;
      return { rows: res.rows as unknown[] };
    },
    async (queries) => {
      const res = (await client.send({
        kind: "batch",
        queries: queries.map((q) => ({
          sql: q.sql,
          params: q.params,
          method: q.method as SqlMethod,
        })),
      })) as QueryResult[];
      return res.map((r) => ({ rows: r.rows as unknown[] }));
    },
  );
}

function toEditorNote(note: Select<"notes">): EditorNote {
  return {
    id: note.id,
    name: note.name,
    folderId: note.folder_id ?? null,
    workspaceId: note.workspace_id ?? null,
    position: note.position ?? 0,
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
  };
}

/** Order notes by their manual position, falling back to creation time. */
function byPosition(a: EditorNote, b: EditorNote): number {
  return a.position - b.position || a.createdAt - b.createdAt;
}

export class EditorPersistenceService implements IEditorPersistenceService {
  private db: SqliteRemoteDatabase;
  private client: WorkerClient;
  // Maps noteId → latest snapshotId (null = no snapshot, undefined = not cached)
  private currentSnapshotId = new Map<string, string | null>();

  constructor(private noteService: INoteService) {
    this.client = new WorkerClient();
    this.db = makeDb(this.client);
  }

  async reset(): Promise<void> {
    this.currentSnapshotId.clear();
    await this.client.send({ kind: "reset" });
  }

  async listNotes(): Promise<EditorNote[]> {
    const notes = await this.noteService.findAll();
    return notes.map(toEditorNote).sort(byPosition);
  }

  async createNote(name: string): Promise<EditorNote> {
    const domainNote = await this.noteService.create({ name });
    const now = Date.now();
    await this.db.insert(editorNotes).values({
      id: domainNote.id,
      name: domainNote.name,
      createdAt: now,
      updatedAt: now,
    });
    await this.client.send({ kind: "create-note-tables", noteId: domainNote.id });
    return toEditorNote(domainNote);
  }

  async renameNote(id: string, name: string): Promise<EditorNote> {
    const domainNote = await this.noteService.update(id, { name });
    await this.db
      .update(editorNotes)
      .set({ name, updatedAt: Date.now() })
      .where(eq(editorNotes.id, id));
    return toEditorNote(domainNote);
  }

  async deleteNote(id: string): Promise<void> {
    await this.client.send({ kind: "drop-note-tables", noteId: id });
    await this.db.delete(editorNotes).where(eq(editorNotes.id, id));
    await this.noteService.delete(id);
    this.currentSnapshotId.delete(id);
  }

  async loadNote(id: string): Promise<NoteContent> {
    // Ensure per-note tables exist for notes learned from the API but not
    // created locally. CREATE TABLE IF NOT EXISTS makes this idempotent.
    await this.client.send({ kind: "create-note-tables", noteId: id });
    const snapsTable = noteSnapshotsTable(id);
    const opsTable = noteOperationsTable(id);

    const snapshots = await this.db
      .select()
      .from(snapsTable)
      .orderBy(desc(snapsTable.createdAt))
      .limit(1);

    const latestSnap = snapshots[0] ?? null;
    this.currentSnapshotId.set(id, latestSnap?.id ?? null);

    if (!latestSnap) {
      return { snapshot: null, snapshotId: null, operations: [] };
    }

    const ops = await this.db
      .select({ id: opsTable.id, data: opsTable.data })
      .from(opsTable)
      .where(eq(opsTable.snapshotId, latestSnap.id))
      .orderBy(asc(opsTable.id));

    return {
      snapshot: await decompress(latestSnap.data),
      snapshotId: latestSnap.id,
      operations: await Promise.all(ops.map((o) => decompress(o.data))),
    };
  }

  async appendOperation(id: string, data: Uint8Array): Promise<void> {
    let snapshotId = this.currentSnapshotId.get(id);
    if (snapshotId === undefined) {
      const content = await this.loadNote(id);
      snapshotId = content.snapshotId;
    }
    const opsTable = noteOperationsTable(id);
    const now = Date.now();
    const compressed = await compress(data);
    await this.db.batch([
      this.db
        .insert(opsTable)
        .values({ snapshotId: snapshotId ?? null, data: compressed, createdAt: now }),
      this.db
        .update(editorNotes)
        .set({ updatedAt: now })
        .where(eq(editorNotes.id, id)),
    ]);
  }

  async compact(
    id: string,
    mergedData: Uint8Array,
    stateVector: Uint8Array,
  ): Promise<void> {
    const snapsTable = noteSnapshotsTable(id);
    const opsTable = noteOperationsTable(id);

    let currentSnapId = this.currentSnapshotId.get(id);
    if (currentSnapId === undefined) {
      const content = await this.loadNote(id);
      currentSnapId = content.snapshotId;
    }

    let highwater = 0;
    if (currentSnapId !== null) {
      const hw = await this.db
        .select({ maxId: max(opsTable.id) })
        .from(opsTable)
        .where(eq(opsTable.snapshotId, currentSnapId));
      highwater = hw[0]?.maxId ?? 0;
    }

    const newSnapshotId = crypto.randomUUID();
    const now = Date.now();
    const compressedData = await compress(mergedData);
    const compressedSv = await compress(stateVector);

    const insertStmt = this.db.insert(snapsTable).values({
      id: newSnapshotId,
      data: compressedData,
      stateVector: compressedSv,
      createdAt: now,
    });
    const updateStmt = this.db
      .update(editorNotes)
      .set({ updatedAt: now })
      .where(eq(editorNotes.id, id));

    if (highwater > 0 && currentSnapId) {
      const deleteStmt = this.db
        .delete(opsTable)
        .where(
          and(
            eq(opsTable.snapshotId, currentSnapId),
            lte(opsTable.id, highwater),
          ),
        );
      await this.db.batch([insertStmt, deleteStmt, updateStmt]);
    } else {
      await this.db.batch([insertStmt, updateStmt]);
    }

    // Update cache only after the batch commits successfully.
    this.currentSnapshotId.set(id, newSnapshotId);
  }

  async getUnsyncedOperations(
    id: string,
  ): Promise<{ id: number; data: Uint8Array }[]> {
    const opsTable = noteOperationsTable(id);
    const rows = await this.db
      .select({ id: opsTable.id, data: opsTable.data })
      .from(opsTable)
      .where(isNull(opsTable.syncedAt))
      .orderBy(asc(opsTable.id));
    return Promise.all(
      rows.map(async (r) => ({ id: r.id, data: await decompress(r.data) })),
    );
  }

  async markOperationsSynced(id: string, opIds: number[]): Promise<void> {
    if (opIds.length === 0) return;
    const opsTable = noteOperationsTable(id);
    const now = Date.now();
    await this.db
      .update(opsTable)
      .set({ syncedAt: now })
      .where(inArray(opsTable.id, opIds));
  }

  async syncNoteList(): Promise<void> {
    const svc = this.noteService as unknown as { sync?: () => Promise<void> };
    if (typeof svc.sync === "function") {
      await svc.sync();
    }
    // Mirror any newly-synced notes into the editor DB so per-note tables and
    // the editorNotes entry exist before the user navigates to them.
    const notes = await this.noteService.findAll();
    const existing = await this.db.select({ id: editorNotes.id }).from(editorNotes);
    const existingIds = new Set(existing.map((r) => r.id));
    for (const note of notes) {
      if (!existingIds.has(note.id)) {
        await this.db.insert(editorNotes).values({
          id: note.id,
          name: note.name,
          createdAt: note.createdAt.getTime(),
          updatedAt: note.updatedAt.getTime(),
        });
        await this.client.send({ kind: "create-note-tables", noteId: note.id });
      }
    }
  }
}
