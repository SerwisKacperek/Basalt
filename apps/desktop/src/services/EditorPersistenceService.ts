import { asc, eq } from "drizzle-orm";
import type {
  EditorNote,
  IEditorPersistenceService,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { Select } from "@basalt/domain";
import { noteUpdates, notes as editorNotes } from "@basalt/db/schema";
import type { EditorDb } from "../db/connection";

function toEditorNote(note: Select<"notes">): EditorNote {
  return {
    id: note.id,
    name: note.name,
    folderId: note.folder_id ?? null,
    workspaceId: note.workspace_id ?? null,
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
  };
}

export class EditorPersistenceService implements IEditorPersistenceService {
  constructor(
    private readonly db: EditorDb,
    private readonly resetDb: () => void,
    private readonly noteService: INoteService,
  ) {}

  async reset(): Promise<void> {
    this.resetDb();
  }

  async listNotes(): Promise<EditorNote[]> {
    const notes = await this.noteService.findAll();
    return notes.map(toEditorNote);
  }

  async createNote(name: string): Promise<EditorNote> {
    const domainNote = await this.noteService.create({ name });
    const now = Date.now();
    this.db
      .insert(editorNotes)
      .values({ id: domainNote.id, name: domainNote.name, createdAt: now, updatedAt: now })
      .run();
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
    this.db.delete(editorNotes).where(eq(editorNotes.id, id)).run();
    await this.noteService.delete(id);
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
      tx.update(editorNotes).set({ updatedAt: now }).where(eq(editorNotes.id, id)).run();
    });
  }

  async compact(id: string, mergedUpdate: Uint8Array): Promise<void> {
    const now = Date.now();
    this.db.transaction((tx) => {
      tx.delete(noteUpdates).where(eq(noteUpdates.noteId, id)).run();
      tx.insert(noteUpdates)
        .values({ noteId: id, updateBlob: mergedUpdate, createdAt: now })
        .run();
      tx.update(editorNotes).set({ updatedAt: now }).where(eq(editorNotes.id, id)).run();
    });
  }
}
