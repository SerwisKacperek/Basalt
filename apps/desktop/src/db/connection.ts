import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { EDITOR_SCHEMA_BOOTSTRAP_SQL } from "@basalt/core/db/editor-schema";

export type EditorDb = ReturnType<typeof openEditorDb>;

export function openEditorDb(filepath: string) {
  const sqlite = new Database(filepath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(EDITOR_SCHEMA_BOOTSTRAP_SQL);
  return drizzle(sqlite);
}
