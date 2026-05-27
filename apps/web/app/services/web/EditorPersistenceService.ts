import { asc, desc, eq } from "drizzle-orm";
import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import type {
  EditorDocument,
  IEditorPersistenceService,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import { documentUpdates, documents } from "@basalt/core/db/editor-schema";

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

class WorkerClient {
  private worker: Worker;
  private nextReqId = 1;
  private pending = new Map<
    number,
    { resolve: (v: QueryResult | QueryResult[]) => void; reject: (e: unknown) => void }
  >();

  constructor() {
    this.worker = new Worker(
      new URL("./editor-db.worker.ts", import.meta.url),
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

function makeDb(client: WorkerClient): SqliteRemoteDatabase {
  return drizzle(
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
  );
}

export class EditorPersistenceService implements IEditorPersistenceService {
  private db: SqliteRemoteDatabase;

  constructor() {
    this.db = makeDb(new WorkerClient());
  }

  async listDocuments(): Promise<EditorDocument[]> {
    return this.db
      .select({
        id: documents.id,
        title: documents.title,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .orderBy(desc(documents.updatedAt));
  }

  async createDocument(title: string): Promise<EditorDocument> {
    const id = crypto.randomUUID();
    const now = Date.now();
    await this.db
      .insert(documents)
      .values({ id, title, createdAt: now, updatedAt: now });
    return { id, title, createdAt: now, updatedAt: now };
  }

  async deleteDocument(id: string): Promise<void> {
    await this.db.delete(documents).where(eq(documents.id, id));
  }

  async loadUpdates(id: string): Promise<Uint8Array[]> {
    const rows = await this.db
      .select({ updateBlob: documentUpdates.updateBlob })
      .from(documentUpdates)
      .where(eq(documentUpdates.documentId, id))
      .orderBy(asc(documentUpdates.id));
    return rows.map((r) => new Uint8Array(r.updateBlob));
  }

  async appendUpdate(id: string, update: Uint8Array): Promise<void> {
    const now = Date.now();
    await this.db.batch([
      this.db
        .insert(documentUpdates)
        .values({ documentId: id, updateBlob: update, createdAt: now }),
      this.db
        .update(documents)
        .set({ updatedAt: now })
        .where(eq(documents.id, id)),
    ]);
  }

  async compact(id: string, mergedUpdate: Uint8Array): Promise<void> {
    const now = Date.now();
    await this.db.batch([
      this.db
        .delete(documentUpdates)
        .where(eq(documentUpdates.documentId, id)),
      this.db
        .insert(documentUpdates)
        .values({ documentId: id, updateBlob: mergedUpdate, createdAt: now }),
      this.db
        .update(documents)
        .set({ updatedAt: now })
        .where(eq(documents.id, id)),
    ]);
  }
}
