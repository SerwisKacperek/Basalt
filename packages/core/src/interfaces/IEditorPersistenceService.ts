export interface EditorNote {
  id: string;
  name: string;
  folderId: string | null;
  workspaceId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface IEditorPersistenceService {
  listNotes(): Promise<EditorNote[]>;
  createNote(name: string): Promise<EditorNote>;
  deleteNote(id: string): Promise<void>;
  loadUpdates(id: string): Promise<Uint8Array[]>;
  appendUpdate(id: string, update: Uint8Array): Promise<void>;
  compact(id: string, mergedUpdate: Uint8Array): Promise<void>;
  /** Wipe and recreate the local database. Destroys all notes. */
  reset(): Promise<void>;
}
