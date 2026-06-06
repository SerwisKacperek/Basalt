import { blob, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  folderId: text("folder_id"),
  workspaceId: text("workspace_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  deletedAt: integer("deleted_at"),
});

export const noteUpdates = sqliteTable(
  "note_updates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    updateBlob: blob("update_blob", { mode: "buffer" })
      .$type<Uint8Array>()
      .notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_note_updates_note").on(t.noteId, t.id)],
);
