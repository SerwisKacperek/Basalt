import { and, asc, desc, eq, inArray, isNull, lte, max } from "drizzle-orm";
import type {
  EditorNote,
  IEditorPersistenceService,
  NoteContent,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { Select } from "@basalt/domain";
import {
  createNoteTablesSQL,
  dropNoteTablesSQL,
  noteOperationsTable,
  noteSnapshotsTable,
  notes as editorNotes,
} from "@basalt/db/schema";
import type { EditorDb, RawSqlite } from "../db/connection";
import { compress, decompress } from "./compression";

function toUint8Array(buf: Buffer | Uint8Array): Uint8Array {
  if (buf instanceof Buffer) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  return buf;
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
  constructor(
    private readonly db: EditorDb,
    private readonly rawSqlite: RawSqlite,
    private readonly resetDb: () => void,
    private readonly noteService: INoteService,
  ) {}

  async reset(): Promise<void> {
    this.resetDb();
  }

  async listNotes(): Promise<EditorNote[]> {
    const notes = await this.noteService.findAll();
    return notes.map(toEditorNote).sort(byPosition);
  }

  async createNote(name: string): Promise<EditorNote> {
    const domainNote = await this.noteService.create({ name });
    const now = Date.now();
    this.db
      .insert(editorNotes)
      .values({ id: domainNote.id, name: domainNote.name, createdAt: now, updatedAt: now })
      .run();
    for (const sql of createNoteTablesSQL(domainNote.id)) {
      this.rawSqlite.exec(sql);
    }
    return toEditorNote(domainNote);
  }

  async renameNote(id: string, name: string): Promise<EditorNote> {
    const domainNote = await this.noteService.update(id, { name });
    this.db
      .update(editorNotes)
      .set({ name, updatedAt: Date.now() })
      .where(eq(editorNotes.id, id))
      .run();
    return toEditorNote(domainNote);
  }

  async deleteNote(id: string): Promise<void> {
    for (const sql of dropNoteTablesSQL(id)) {
      this.rawSqlite.exec(sql);
    }
    this.db.delete(editorNotes).where(eq(editorNotes.id, id)).run();
    await this.noteService.delete(id);
  }

  private ensureNoteTables(id: string): void {
    for (const sql of createNoteTablesSQL(id)) {
      this.rawSqlite.exec(sql);
    }
  }

  async loadNote(id: string): Promise<NoteContent> {
    this.ensureNoteTables(id);
    const snapsTable = noteSnapshotsTable(id);
    const opsTable = noteOperationsTable(id);

    const snapshots = this.db
      .select()
      .from(snapsTable)
      .orderBy(desc(snapsTable.createdAt))
      .limit(1)
      .all();

    const latestSnap = snapshots[0] ?? null;

    if (!latestSnap) {
      return { snapshot: null, snapshotId: null, operations: [] };
    }

    const ops = this.db
      .select({ id: opsTable.id, data: opsTable.data })
      .from(opsTable)
      .where(eq(opsTable.snapshotId, latestSnap.id))
      .orderBy(asc(opsTable.id))
      .all();

    return {
      snapshot: await decompress(toUint8Array(latestSnap.data as unknown as Buffer)),
      snapshotId: latestSnap.id,
      operations: await Promise.all(
        ops.map((o) => decompress(toUint8Array(o.data as unknown as Buffer))),
      ),
    };
  }

  async appendOperation(id: string, data: Uint8Array): Promise<void> {
    this.ensureNoteTables(id);
    const safe = id.replace(/-/g, "_");
    const row = this.rawSqlite
      .prepare(
        `SELECT id FROM "note_${safe}_snapshots" ORDER BY created_at DESC LIMIT 1`,
      )
      .get() as { id: string } | undefined;
    const snapshotId = row?.id ?? null;

    const opsTable = noteOperationsTable(id);
    const now = Date.now();
    const compressed = await compress(data);

    this.db.transaction((tx) => {
      tx
        .insert(opsTable)
        .values({ snapshotId, data: compressed, createdAt: now })
        .run();
      tx.update(editorNotes).set({ updatedAt: now }).where(eq(editorNotes.id, id)).run();
    });
  }

  async compact(
    id: string,
    mergedData: Uint8Array,
    stateVector: Uint8Array,
  ): Promise<void> {
    this.ensureNoteTables(id);
    const safe = id.replace(/-/g, "_");
    const latestSnap = this.rawSqlite
      .prepare(
        `SELECT id FROM "note_${safe}_snapshots" ORDER BY created_at DESC LIMIT 1`,
      )
      .get() as { id: string } | undefined;

    const oldSnapshotId = latestSnap?.id ?? null;
    let highwater = 0;
    if (oldSnapshotId) {
      const hw = this.rawSqlite
        .prepare(
          `SELECT MAX(id) as max_id FROM "note_${safe}_operations" WHERE snapshot_id = ?`,
        )
        .get(oldSnapshotId) as { max_id: number | null };
      highwater = hw?.max_id ?? 0;
    }

    const newSnapshotId = crypto.randomUUID();
    const now = Date.now();
    const compressedData = await compress(mergedData);
    const compressedSv = await compress(stateVector);

    const snapsTable = noteSnapshotsTable(id);
    const opsTable = noteOperationsTable(id);

    this.db.transaction((tx) => {
      tx
        .insert(snapsTable)
        .values({
          id: newSnapshotId,
          data: compressedData,
          stateVector: compressedSv,
          createdAt: now,
        })
        .run();
      if (highwater > 0 && oldSnapshotId) {
        tx
          .delete(opsTable)
          .where(
            and(
              eq(opsTable.snapshotId, oldSnapshotId),
              lte(opsTable.id, highwater),
            ),
          )
          .run();
      }
      tx.update(editorNotes).set({ updatedAt: now }).where(eq(editorNotes.id, id)).run();
    });
  }

  async getUnsyncedOperations(
    id: string,
  ): Promise<{ id: number; data: Uint8Array }[]> {
    const opsTable = noteOperationsTable(id);
    const rows = this.db
      .select({ id: opsTable.id, data: opsTable.data })
      .from(opsTable)
      .where(isNull(opsTable.syncedAt))
      .orderBy(asc(opsTable.id))
      .all();
    return Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        data: await decompress(toUint8Array(r.data as unknown as Buffer)),
      })),
    );
  }

  async markOperationsSynced(id: string, opIds: number[]): Promise<void> {
    if (opIds.length === 0) return;
    const opsTable = noteOperationsTable(id);
    const now = Date.now();
    this.db
      .update(opsTable)
      .set({ syncedAt: now })
      .where(inArray(opsTable.id, opIds))
      .run();
  }

  async syncNoteList(): Promise<void> {
    const svc = this.noteService as unknown as { sync?: () => Promise<void> };
    if (typeof svc.sync === "function") {
      await svc.sync();
    }
  }
}
