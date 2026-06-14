import { asc, eq } from "drizzle-orm";
import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import type {
  EditorNote,
  IEditorPersistenceService,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { Select } from "@basalt/domain";
import { noteUpdates, notes as editorNotes } from "@basalt/db/schema";

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

  constructor(private noteService: INoteService) {
    this.client = new WorkerClient();
    this.db = makeDb(this.client);
  }

  async reset(): Promise<void> {
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
    await this.db.delete(editorNotes).where(eq(editorNotes.id, id));
    await this.noteService.delete(id);
  }

  async loadUpdates(id: string): Promise<Uint8Array[]> {
    const rows = await this.db
      .select({ updateBlob: noteUpdates.updateBlob })
      .from(noteUpdates)
      .where(eq(noteUpdates.noteId, id))
      .orderBy(asc(noteUpdates.id));
    return rows.map((r) => r.updateBlob);
  }

  async appendUpdate(id: string, update: Uint8Array): Promise<void> {
    const now = Date.now();
    await this.db.batch([
      this.db
        .insert(noteUpdates)
        .values({ noteId: id, updateBlob: update, createdAt: now }),
      this.db.update(editorNotes).set({ updatedAt: now }).where(eq(editorNotes.id, id)),
    ]);
  }

  async compact(id: string, mergedUpdate: Uint8Array): Promise<void> {
    const now = Date.now();
    await this.db.batch([
      this.db.delete(noteUpdates).where(eq(noteUpdates.noteId, id)),
      this.db
        .insert(noteUpdates)
        .values({ noteId: id, updateBlob: mergedUpdate, createdAt: now }),
      this.db.update(editorNotes).set({ updatedAt: now }).where(eq(editorNotes.id, id)),
    ]);
  }
}
