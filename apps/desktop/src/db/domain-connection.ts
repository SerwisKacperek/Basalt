import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { schema as sqliteSchema } from "@basalt/domain/schema/sqlite";
import { DOMAIN_BOOTSTRAP_SQL } from "@basalt/domain";
import type { Db, Schema } from "@basalt/domain";

export type DomainDb = { db: Db; schema: Schema };

export function openDomainDb(filepath: string): DomainDb {
  const sqlite = new Database(filepath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(DOMAIN_BOOTSTRAP_SQL);
  const db = drizzle(sqlite, { schema: sqliteSchema }) as unknown as Db;
  return { db, schema: sqliteSchema as unknown as Schema };
}
