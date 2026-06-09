import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { applyMigrations, resetDatabase } from "@basalt/db/migrate";
import { migrations } from "@basalt/db/migrations-bundle";

export interface EditorDbHandle {
  db: BetterSQLite3Database;
  reset: () => void;
}

export type EditorDb = BetterSQLite3Database;

export function openEditorDb(filepath: string): EditorDbHandle {
  const sqlite = new Database(filepath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  applyMigrations(sqlite, migrations);
  return {
    db: drizzle(sqlite),
    reset: () => resetDatabase(sqlite, migrations),
  };
}
