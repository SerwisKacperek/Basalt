import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import type {
  EditorDocument,
  IEditorPersistenceService,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import { documentUpdates, documents } from "@basalt/core/db/editor-schema";
import type { EditorDb } from "../db/connection";

export class EditorPersistenceService implements IEditorPersistenceService {
  constructor(private readonly db: EditorDb) {}

  async listDocuments(): Promise<EditorDocument[]> {
    return this.db
      .select({
        id: documents.id,
        title: documents.title,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .orderBy(desc(documents.updatedAt))
      .all();
  }

  async createDocument(title: string): Promise<EditorDocument> {
    const id = randomUUID();
    const now = Date.now();
    this.db
      .insert(documents)
      .values({ id, title, createdAt: now, updatedAt: now })
      .run();
    return { id, title, createdAt: now, updatedAt: now };
  }

  async deleteDocument(id: string): Promise<void> {
    this.db.delete(documents).where(eq(documents.id, id)).run();
  }

  async loadUpdates(id: string): Promise<Uint8Array[]> {
    const rows = this.db
      .select({ updateBlob: documentUpdates.updateBlob })
      .from(documentUpdates)
      .where(eq(documentUpdates.documentId, id))
      .orderBy(asc(documentUpdates.id))
      .all();
    return rows.map((r) => new Uint8Array(r.updateBlob));
  }

  async appendUpdate(id: string, update: Uint8Array): Promise<void> {
    const now = Date.now();
    const buf = Buffer.from(update);
    this.db.transaction((tx) => {
      tx.insert(documentUpdates)
        .values({ documentId: id, updateBlob: buf, createdAt: now })
        .run();
      tx.update(documents)
        .set({ updatedAt: now })
        .where(eq(documents.id, id))
        .run();
    });
  }

  async compact(id: string, mergedUpdate: Uint8Array): Promise<void> {
    const now = Date.now();
    const buf = Buffer.from(mergedUpdate);
    this.db.transaction((tx) => {
      tx.delete(documentUpdates)
        .where(eq(documentUpdates.documentId, id))
        .run();
      tx.insert(documentUpdates)
        .values({ documentId: id, updateBlob: buf, createdAt: now })
        .run();
      tx.update(documents)
        .set({ updatedAt: now })
        .where(eq(documents.id, id))
        .run();
    });
  }
}
