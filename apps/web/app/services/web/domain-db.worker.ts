/// <reference lib="webworker" />
import sqlite3InitModule, { type Database } from "@sqlite.org/sqlite-wasm";
import { DOMAIN_BOOTSTRAP_SQL } from "@basalt/domain";

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
    };

type QueryResult = { rows: unknown[] | unknown[][] };

type Res =
  | { reqId: number; ok: true; data: QueryResult | QueryResult[] }
  | { reqId: number; ok: false; error: string };

let dbReady: Promise<Database> | null = null;

async function openDb(): Promise<Database> {
  const sqlite3 = await sqlite3InitModule({
    print: () => {},
    printErr: (msg: string) => console.error("[sqlite-wasm:domain]", msg),
  });
  const poolUtil = await sqlite3.installOpfsSAHPoolVfs({
    name: "basalt-domain-pool",
  });
  const db = new poolUtil.OpfsSAHPoolDb("/basalt-domain.db");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(DOMAIN_BOOTSTRAP_SQL);
  return db;
}

function getDb(): Promise<Database> {
  if (!dbReady) dbReady = openDb();
  return dbReady;
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
