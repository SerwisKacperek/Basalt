import {
  customType,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const bytes = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType: () => "blob",
  fromDriver: (value) => new Uint8Array(value),
  toDriver: (value) => value,
});

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
    updateBlob: bytes("update_blob").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_note_updates_note").on(t.noteId, t.id)],
);
