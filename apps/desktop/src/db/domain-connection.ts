import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { schema as sqliteSchema } from "@basalt/domain/schema/sqlite";
import { applyMigrations } from "@basalt/domain/migrate";
import { migrations } from "@basalt/domain/migrations-bundle";
import type { Db, Schema } from "@basalt/domain";

export type DomainDb = { db: Db; schema: Schema };

export function openDomainDb(filepath: string): DomainDb {
  const sqlite = new Database(filepath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  applyMigrations(sqlite, migrations);
  const db = drizzle(sqlite, { schema: sqliteSchema }) as unknown as Db;
  return { db, schema: sqliteSchema as unknown as Schema };
}
