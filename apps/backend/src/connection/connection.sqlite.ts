import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

import { schema } from "@basalt/domain/schema/sqlite";

export function createDb(filepath: string) {
  const sqlite = new Database(filepath);
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof createDb>;
