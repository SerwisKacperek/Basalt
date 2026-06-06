/// <reference lib="webworker" />
import sqlite3InitModule, { type Database } from "@sqlite.org/sqlite-wasm";
import { splitSqlStatements } from "@basalt/db/migrate";
import { migrations } from "@basalt/db/migrations-bundle";

type SqlMethod = "all" | "get" | "values" | "run";

type Req =
  | {
      reqId: number;
      kind: "query";
      sql: string;
      params: unknown[];
      method: SqlMethod;
    }
  | {
      reqId: number;
      kind: "batch";
      queries: { sql: string; params: unknown[]; method: SqlMethod }[];
    }
  | {
      reqId: number;
      kind: "reset";
    };

type QueryResult = { rows: unknown[] | unknown[][] };

type Res =
  | { reqId: number; ok: true; data: QueryResult | QueryResult[] }
  | { reqId: number; ok: false; error: string };

let dbReady: Promise<Database> | null = null;

const OPEN_RETRIES = 10;
const OPEN_RETRY_DELAY_MS = 150;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function openDb(): Promise<Database> {
  const sqlite3 = await sqlite3InitModule({
    print: () => {},
    printErr: (msg: string) => console.error("[sqlite-wasm]", msg),
  });
  // After a page refresh the previous worker's OPFS SyncAccessHandles may not be
  // released yet, so acquiring the SAH pool can fail transiently. Retry briefly.
  let lastError: unknown;
  for (let attempt = 0; attempt < OPEN_RETRIES; attempt++) {
    try {
      const poolUtil = await sqlite3.installOpfsSAHPoolVfs({
        name: "basalt-editor-pool",
      });
      const db = new poolUtil.OpfsSAHPoolDb("/basalt-editor.db");
      db.exec("PRAGMA foreign_keys = ON;");
      runMigrations(db);
      return db;
    } catch (e) {
      lastError = e;
      await delay(OPEN_RETRY_DELAY_MS);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// Applies pending drizzle-kit migrations, tracking what has run in a
// __drizzle_migrations table. Replaces hand-written bootstrap DDL so the
// Drizzle schema in @basalt/db stays the single source of truth.
function runMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
  `);
  for (const migration of migrations) {
    const applied: unknown[][] = [];
    db.exec({
      sql: "SELECT 1 FROM __drizzle_migrations WHERE tag = ?",
      bind: [migration.tag],
      rowMode: "array",
      resultRows: applied as unknown as never[],
    });
    if (applied.length > 0) continue;
    db.exec("BEGIN");
    try {
      for (const statement of splitSqlStatements(migration.sql)) db.exec(statement);
      db.exec({
        sql: "INSERT INTO __drizzle_migrations (tag, created_at) VALUES (?, ?)",
        bind: [migration.tag, Date.now()],
      });
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
}

function getDb(): Promise<Database> {
  // Don't cache a rejected open: a transient OPFS failure (e.g. the previous
  // page's handles not yet released after a refresh) must be retryable.
  if (!dbReady) {
    dbReady = openDb().catch((e) => {
      dbReady = null;
      throw e;
    });
  }
  return dbReady;
}

// Drop every user table and re-run migrations, recovering from a corrupt or
// stale local database.
function resetDb(db: Database): void {
  const rows: unknown[][] = [];
  db.exec({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    rowMode: "array",
    resultRows: rows as unknown as never[],
  });
  db.exec("PRAGMA foreign_keys = OFF;");
  db.exec("BEGIN");
  try {
    for (const row of rows) db.exec(`DROP TABLE IF EXISTS "${row[0]}";`);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    db.exec("PRAGMA foreign_keys = ON;");
    throw e;
  }
  db.exec("PRAGMA foreign_keys = ON;");
  runMigrations(db);
}

function runOne(
  db: Database,
  sql: string,
  params: unknown[],
  method: SqlMethod,
): QueryResult {
  if (method === "run") {
    db.exec({ sql, bind: params as never[] });
    return { rows: [] };
  }
  const rows: unknown[][] = [];
  db.exec({
    sql,
    bind: params as never[],
    rowMode: "array",
    resultRows: rows as unknown as never[],
  });
  if (method === "get") {
    return { rows: rows[0] ?? [] };
  }
  return { rows };
}

async function handle(req: Req): Promise<QueryResult | QueryResult[]> {
  const db = await getDb();
  if (req.kind === "reset") {
    resetDb(db);
    return { rows: [] };
  }
  if (req.kind === "query") {
    return runOne(db, req.sql, req.params, req.method);
  }
  db.exec("BEGIN");
  try {
    const results = req.queries.map((q) =>
      runOne(db, q.sql, q.params, q.method),
    );
    db.exec("COMMIT");
    return results;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

self.onmessage = async (e: MessageEvent<Req>) => {
  const req = e.data;
  try {
    const data = await handle(req);
    const res: Res = { reqId: req.reqId, ok: true, data };
    (self as unknown as Worker).postMessage(res);
  } catch (err) {
    const res: Res = {
      reqId: req.reqId,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(res);
  }
};
