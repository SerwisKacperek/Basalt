import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import type {
  EditorNote,
  IEditorPersistenceService,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import { noteUpdates, notes } from "@basalt/db/schema";
import type { EditorDb } from "../db/connection";

export class EditorPersistenceService implements IEditorPersistenceService {
  constructor(
    private readonly db: EditorDb,
    private readonly resetDb: () => void,
  ) {}

  async reset(): Promise<void> {
    this.resetDb();
  }

  async listNotes(): Promise<EditorNote[]> {
    return this.db
      .select({
        id: notes.id,
        name: notes.name,
        folderId: notes.folderId,
        workspaceId: notes.workspaceId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .orderBy(desc(notes.updatedAt))
      .all();
  }

  async createNote(name: string): Promise<EditorNote> {
    const id = randomUUID();
    const now = Date.now();
    this.db
      .insert(notes)
      .values({ id, name, createdAt: now, updatedAt: now })
      .run();
    return {
      id,
      name,
      folderId: null,
      workspaceId: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async deleteNote(id: string): Promise<void> {
    this.db.delete(notes).where(eq(notes.id, id)).run();
  }

  async loadUpdates(id: string): Promise<Uint8Array[]> {
    const rows = this.db
      .select({ updateBlob: noteUpdates.updateBlob })
      .from(noteUpdates)
      .where(eq(noteUpdates.noteId, id))
      .orderBy(asc(noteUpdates.id))
      .all();
    return rows.map((r) => r.updateBlob);
  }

  async appendUpdate(id: string, update: Uint8Array): Promise<void> {
    const now = Date.now();
    this.db.transaction((tx) => {
      tx.insert(noteUpdates)
        .values({ noteId: id, updateBlob: update, createdAt: now })
        .run();
      tx.update(notes).set({ updatedAt: now }).where(eq(notes.id, id)).run();
    });
  }

  async compact(id: string, mergedUpdate: Uint8Array): Promise<void> {
    const now = Date.now();
    this.db.transaction((tx) => {
      tx.delete(noteUpdates).where(eq(noteUpdates.noteId, id)).run();
      tx.insert(noteUpdates)
        .values({ noteId: id, updateBlob: mergedUpdate, createdAt: now })
        .run();
      tx.update(notes).set({ updatedAt: now }).where(eq(notes.id, id)).run();
    });
  }
}
