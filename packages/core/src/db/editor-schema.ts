import { blob, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const documentUpdates = sqliteTable(
  "document_updates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    updateBlob: blob("update_blob", { mode: "buffer" })
      .$type<Uint8Array>()
      .notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_document_updates_doc").on(t.documentId, t.id)],
);

export const EDITOR_SCHEMA_BOOTSTRAP_SQL = `
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS document_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    update_blob BLOB NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_document_updates_doc
    ON document_updates(document_id, id);
`;

