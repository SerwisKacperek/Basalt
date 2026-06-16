import { Elysia, t } from "elysia";
import * as Y from "yjs";
import type { RawDb } from "../../shared/factories/db.factory";
import { getDialect } from "../../shared/factories/db.factory";
import { NoteContentService } from "./note-content.service";
import { NoteRegistry, InMemoryPubSub, prefixMsg } from "./note-registry";
import { BunWsChannel, type IClientChannel } from "./client-channel";

type WsConnData = {
  clientId: string;
  noteId: string;
  unsub: (() => void) | null;
  channel: IClientChannel;
};

function bufToUint8Array(buf: unknown): Uint8Array {
  if (buf instanceof Uint8Array) return buf;
  if (Buffer.isBuffer(buf)) {
    return new Uint8Array(
      (buf as Buffer).buffer,
      (buf as Buffer).byteOffset,
      (buf as Buffer).byteLength,
    );
  }
  if (buf instanceof ArrayBuffer) return new Uint8Array(buf);
  throw new Error("Unexpected binary type");
}

export function createNoteContentRoutes(rawDb: RawDb) {
  const dialect = getDialect();
  const contentService = new NoteContentService(rawDb, dialect);
  const pubSub = new InMemoryPubSub();
  const registry = new NoteRegistry(contentService, pubSub);
  const wsConnData = new WeakMap<object, WsConnData>();

  return new Elysia({ prefix: "/notes" })
    .get(
      "/:id/content",
      async ({ params }) => {
        const content = await contentService.loadNote(params.id);
        return {
          snapshotId: content.snapshotId,
          snapshot: content.snapshot
            ? Buffer.from(content.snapshot).toString("base64")
            : null,
          operations: content.operations.map((op) =>
            Buffer.from(op).toString("base64"),
          ),
        };
      },
      { params: t.Object({ id: t.String() }) },
    )
    .post(
      "/:id/operations",
      async ({ params, body }) => {
        const op = bufToUint8Array(Buffer.from(body.data, "base64"));
        const opId = await contentService.appendOperation(params.id, op);
        return { id: opId };
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({ data: t.String() }),
      },
    )
    .post(
      "/:id/compact",
      async ({ params, body }) => {
        const mergedData = bufToUint8Array(Buffer.from(body.data, "base64"));
        const stateVector = bufToUint8Array(
          Buffer.from(body.stateVector, "base64"),
        );
        const snapshotId = await contentService.compact(
          params.id,
          mergedData,
          stateVector,
        );
        return { snapshotId };
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({ data: t.String(), stateVector: t.String() }),
      },
    )
    .post(
      "/:id/sync",
      async ({ params, body }) => {
        const clientSv = body?.stateVector
          ? bufToUint8Array(Buffer.from(body.stateVector, "base64"))
          : null;
        if (clientSv) {
          const delta = await registry.getDeltaForClient(params.id, clientSv);
          return { update: Buffer.from(delta).toString("base64") };
        }
        const content = await contentService.loadNote(params.id);
        return {
          snapshotId: content.snapshotId,
          snapshot: content.snapshot
            ? Buffer.from(content.snapshot).toString("base64")
            : null,
          operations: content.operations.map((op) =>
            Buffer.from(op).toString("base64"),
          ),
        };
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Optional(t.Object({ stateVector: t.Optional(t.String()) })),
      },
    )
    .ws("/:id/ws", {
      params: t.Object({ id: t.String() }),
      async open(ws) {
        const raw = ws.raw as object;
        const noteId = ws.data.params.id;
        const clientId = crypto.randomUUID();
        const channel = new BunWsChannel(ws.raw);
        const meta: WsConnData = { clientId, noteId, unsub: null, channel };
        wsConnData.set(raw, meta);
        meta.unsub = pubSub.subscribe(noteId, clientId, (msg) => {
          channel.send(msg);
        });
        // Load doc and send sync step 1: server state vector
        const doc = await registry.getOrLoad(noteId);
        const sv = Y.encodeStateVector(doc);
        channel.send(prefixMsg(0x00, sv));
      },
      message(ws, message: unknown) {
        const meta = wsConnData.get(ws.raw as object);
        if (!meta) return;
        if (typeof message === "string") return;
        let raw: Uint8Array;
        try {
          raw = bufToUint8Array(message);
        } catch {
          return;
        }
        if (raw.length < 1) return;
        const type = raw[0];
        const payload = raw.slice(1);

        if (type === 0x00) {
          // Client state vector → send delta they're missing
          registry
            .getDeltaForClient(meta.noteId, payload)
            .then((delta) => meta.channel.send(prefixMsg(0x01, delta)))
            .catch(console.error);
        } else if (type === 0x01) {
          // Client's delta for server → apply + broadcast, no persist (sender owns durability)
          registry
            .applyOnly(meta.noteId, payload, meta.clientId)
            .catch(console.error);
        } else if (type === 0x02) {
          // Incremental update → apply + persist + broadcast, then ACK sender
          registry
            .applyAndBroadcast(meta.noteId, payload, meta.clientId)
            .then(() => meta.channel.send(new Uint8Array([0x03])))
            .catch(console.error);
        }
      },
      close(ws) {
        const meta = wsConnData.get(ws.raw as object);
        if (meta?.unsub) meta.unsub();
        wsConnData.delete(ws.raw as object);
      },
    });
}
