export interface EditorDocument {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface IEditorPersistenceService {
  listDocuments(): Promise<EditorDocument[]>;
  createDocument(title: string): Promise<EditorDocument>;
  deleteDocument(id: string): Promise<void>;
  loadUpdates(id: string): Promise<Uint8Array[]>;
  appendUpdate(id: string, update: Uint8Array): Promise<void>;
  compact(id: string, mergedUpdate: Uint8Array): Promise<void>;
}
