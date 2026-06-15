import {
  customType,
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

export type DbDialect = "sqlite" | "pg";

export function noteSnapshotsTable(noteId: string) {
  const name = `note_${noteId.replace(/-/g, "_")}_snapshots`;
  return sqliteTable(name, {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    data: bytes("data").notNull(),
    stateVector: bytes("state_vector"),
    createdAt: integer("created_at").notNull(),
    syncedAt: integer("synced_at"),
  });
}

export function noteOperationsTable(noteId: string) {
  const name = `note_${noteId.replace(/-/g, "_")}_operations`;
  return sqliteTable(name, {
    id: integer("id").primaryKey({ autoIncrement: true }),
    snapshotId: text("snapshot_id"),
    data: bytes("data").notNull(),
    createdAt: integer("created_at").notNull(),
    syncedAt: integer("synced_at"),
  });
}

export function createNoteTablesSQL(
  noteId: string,
  dialect: DbDialect = "sqlite",
): string[] {
  const safe = noteId.replace(/-/g, "_");
  if (dialect === "pg") {
    return [
      `CREATE TABLE IF NOT EXISTS "note_${safe}_snapshots" (id TEXT PRIMARY KEY, data BYTEA NOT NULL, state_vector BYTEA, created_at BIGINT NOT NULL, synced_at BIGINT)`,
      `CREATE TABLE IF NOT EXISTS "note_${safe}_operations" (id SERIAL PRIMARY KEY, snapshot_id TEXT REFERENCES "note_${safe}_snapshots"(id) ON DELETE CASCADE, data BYTEA NOT NULL, created_at BIGINT NOT NULL, synced_at BIGINT)`,
      `CREATE INDEX IF NOT EXISTS "idx_note_${safe}_ops" ON "note_${safe}_operations"(snapshot_id, id)`,
    ];
  }
  return [
    `CREATE TABLE IF NOT EXISTS "note_${safe}_snapshots" (id TEXT PRIMARY KEY, data BLOB NOT NULL, state_vector BLOB, created_at INTEGER NOT NULL, synced_at INTEGER)`,
    `CREATE TABLE IF NOT EXISTS "note_${safe}_operations" (id INTEGER PRIMARY KEY AUTOINCREMENT, snapshot_id TEXT REFERENCES "note_${safe}_snapshots"(id) ON DELETE CASCADE, data BLOB NOT NULL, created_at INTEGER NOT NULL, synced_at INTEGER)`,
    `CREATE INDEX IF NOT EXISTS "idx_note_${safe}_ops" ON "note_${safe}_operations"(snapshot_id, id)`,
  ];
}

export function dropNoteTablesSQL(noteId: string): string[] {
  const safe = noteId.replace(/-/g, "_");
  return [
    `DROP TABLE IF EXISTS "note_${safe}_operations"`,
    `DROP TABLE IF EXISTS "note_${safe}_snapshots"`,
  ];
}
