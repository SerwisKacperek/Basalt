import { drizzle } from "drizzle-orm/sqlite-proxy";
import { schema as sqliteSchema } from "@basalt/domain/schema/sqlite";
import type { Db, Schema } from "@basalt/domain";

type SqlMethod = "all" | "get" | "values" | "run";
type QueryResult = { rows: unknown[] | unknown[][] };

type WorkerReq =
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

type WorkerRes =
  | { reqId: number; ok: true; data: QueryResult | QueryResult[] }
  | { reqId: number; ok: false; error: string };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type SendReq = DistributiveOmit<WorkerReq, "reqId">;

class DomainWorkerClient {
  private worker: Worker;
  private nextReqId = 1;
  private pending = new Map<
    number,
    { resolve: (v: QueryResult | QueryResult[]) => void; reject: (e: unknown) => void }
  >();

  constructor() {
    this.worker = new Worker(
      new URL("./domain-db.worker.ts", import.meta.url),
      { type: "module" },
    );
    this.worker.onmessage = (e: MessageEvent<WorkerRes>) => {
      const res = e.data;
      const pending = this.pending.get(res.reqId);
      if (!pending) return;
      this.pending.delete(res.reqId);
      if (res.ok) pending.resolve(res.data);
      else pending.reject(new Error(res.error));
    };
  }

  send(req: SendReq): Promise<QueryResult | QueryResult[]> {
    const reqId = this.nextReqId++;
    return new Promise((resolve, reject) => {
      this.pending.set(reqId, { resolve, reject });
      this.worker.postMessage({ ...req, reqId } as WorkerReq);
    });
  }
}

export function createDomainDb(): { db: Db; schema: Schema } {
  const client = new DomainWorkerClient();

  const db = drizzle(
    async (sql, params, method) => {
      const res = (await client.send({
        kind: "query",
        sql,
        params,
        method: method as SqlMethod,
      })) as QueryResult;
      return { rows: res.rows as unknown[] };
    },
    async (queries) => {
      const res = (await client.send({
        kind: "batch",
        queries: queries.map((q) => ({
          sql: q.sql,
          params: q.params,
          method: q.method as SqlMethod,
        })),
      })) as QueryResult[];
      return res.map((r) => ({ rows: r.rows as unknown[] }));
    },
    { schema: sqliteSchema },
  );

  return {
    db: db as unknown as Db,
    schema: sqliteSchema as unknown as Schema,
  };
}
