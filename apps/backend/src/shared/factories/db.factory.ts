import { createDb as createPgDb, type Db as PgDb } from '../../connection/connection.pg';
import { createDb as createSqliteDb } from '../../connection/connection.sqlite';

// pg-as-canonical: all callers use this type regardless of dialect
// sqlite db is cast to Db — safe because sqlite satisfies AppSchema and
// all query operations (db.query.*, db.select, db.insert, etc.) are async-compatible
export type Db = PgDb;

export function createDb(): Db {
  const dialect = process.env.DB_DIALECT ?? 'postgresql';
  const url = process.env.DATABASE_URL!;

  if (dialect === 'sqlite') {
    return createSqliteDb(url) as unknown as Db;
  }

  return createPgDb(url);
}

export default createDb;
