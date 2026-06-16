import type { Pool } from "pg";
import { createDb as createPgDb, type Db as PgDb } from '../../connection/connection.pg';
import { createDb as createSqliteDb } from '../../connection/connection.sqlite';

// pg-as-canonical: all callers use this type regardless of dialect
// sqlite db is cast to Db — safe because sqlite satisfies AppSchema and
// all query operations (db.query.*, db.select, db.insert, etc.) are async-compatible
export type Db = PgDb;

export type DbDialect = "sqlite" | "pg";

export interface RawDb {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  exec(sql: string, params?: unknown[]): Promise<void>;
}

export function getDialect(): DbDialect {
  return (process.env.DB_DIALECT ?? "postgresql") === "sqlite" ? "sqlite" : "pg";
}

export function createDb(): Db {
  const dialect = process.env.DB_DIALECT ?? 'postgresql';
  const url = process.env.DATABASE_URL!;

  if (dialect === 'sqlite') {
    return createSqliteDb(url) as unknown as Db;
  }

  return createPgDb(url);
}

export function createRawDb(db: Db): RawDb {
  const dialect = getDialect();
  // Access the underlying driver client exposed by drizzle-orm
  const client = (db as unknown as { $client: unknown }).$client;

  if (dialect === "sqlite") {
    type Stmt = { all(...params: unknown[]): unknown[]; run(...params: unknown[]): unknown };
    type SqliteClient = { prepare(sql: string): Stmt; exec(sql: string): void };
    const sqlite = client as SqliteClient;
    return {
      async query(sql, params = []) {
        return sqlite.prepare(sql).all(...params) as Record<string, unknown>[];
      },
      async exec(sql, params = []) {
        if (params.length > 0) {
          sqlite.prepare(sql).run(...params);
        } else {
          sqlite.exec(sql);
        }
      },
    };
  }

  const pool = client as Pool;
  return {
    async query(sql, params = []) {
      const result = await pool.query(sql, params as unknown[]);
      return result.rows as Record<string, unknown>[];
    },
    async exec(sql, params = []) {
      await pool.query(sql, params as unknown[]);
    },
  };
}

export default createDb;
