import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { applyMigrations, resetDatabase } from "@basalt/db/migrate";
import { migrations } from "@basalt/db/migrations-bundle";
import { createNoteTablesSQL } from "@basalt/db/schema";

export type EditorDb = BetterSQLite3Database;
export type RawSqlite = InstanceType<typeof Database>;

export interface EditorDbHandle {
  db: EditorDb;
  rawSqlite: RawSqlite;
  reset: () => void;
}

// Moves any existing note_updates rows into per-note tables, then drops
// note_updates. Safe to call on a fresh DB (no-op if already done).
function runJsEditorMigrations(sqlite: RawSqlite): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __js_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
  `);

  const jsMigTag = "migrate_note_updates_to_per_note_tables";
  const alreadyRun = sqlite
    .prepare("SELECT 1 FROM __js_migrations WHERE tag = ?")
    .get(jsMigTag);

  if (!alreadyRun) {
    const tableExists = sqlite
      .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='note_updates'")
      .get();

    if (tableExists) {
      const notes = sqlite.prepare("SELECT id FROM notes").all() as { id: string }[];

      for (const { id } of notes) {
        for (const sql of createNoteTablesSQL(id)) sqlite.exec(sql);

        const updates = sqlite
          .prepare(
            "SELECT update_blob FROM note_updates WHERE note_id = ? ORDER BY id ASC",
          )
          .all(id) as { update_blob: Buffer }[];

        if (updates.length > 0) {
          const safe = id.replace(/-/g, "_");
          const snapshotId = crypto.randomUUID();
          const now = Date.now();
          sqlite
            .prepare(
              `INSERT INTO "note_${safe}_snapshots" (id, data, created_at) VALUES (?, ?, ?)`,
            )
            .run(snapshotId, updates[0].update_blob, now);
          for (let i = 1; i < updates.length; i++) {
            sqlite
              .prepare(
                `INSERT INTO "note_${safe}_operations" (snapshot_id, data, created_at) VALUES (?, ?, ?)`,
              )
              .run(snapshotId, updates[i].update_blob, now);
          }
        }
      }
      sqlite.exec("DROP TABLE IF EXISTS note_updates");
    }

    sqlite
      .prepare("INSERT INTO __js_migrations (tag, created_at) VALUES (?, ?)")
      .run(jsMigTag, Date.now());
  }
}

export function openEditorDb(filepath: string): EditorDbHandle {
  const sqlite = new Database(filepath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  applyMigrations(sqlite, migrations);
  runJsEditorMigrations(sqlite);
  return {
    db: drizzle(sqlite),
    rawSqlite: sqlite,
    reset: () => resetDatabase(sqlite, migrations),
  };
}
