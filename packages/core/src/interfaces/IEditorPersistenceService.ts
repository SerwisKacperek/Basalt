export interface EditorNote {
  id: string;
  name: string;
  folderId: string | null;
  workspaceId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface NoteContent {
  snapshot: Uint8Array | null;
  snapshotId: string | null;
  operations: Uint8Array[];
}

export interface IEditorPersistenceService {
  listNotes(): Promise<EditorNote[]>;
  createNote(name: string): Promise<EditorNote>;
  deleteNote(id: string): Promise<void>;
  loadNote(id: string): Promise<NoteContent>;
  appendOperation(id: string, data: Uint8Array): Promise<void>;
  compact(id: string, mergedData: Uint8Array, stateVector: Uint8Array): Promise<void>;
  reset(): Promise<void>;
  getUnsyncedOperations(id: string): Promise<{ id: number; data: Uint8Array }[]>;
  markOperationsSynced(id: string, opIds: number[]): Promise<void>;
  syncNoteList(): Promise<void>;
}
