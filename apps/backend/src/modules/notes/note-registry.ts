import * as Y from "yjs";
import type { NoteContentService } from "./note-content.service";

export interface INotePubSub {
  publish(noteId: string, msg: Uint8Array, excludeClient?: string): void;
  subscribe(
    noteId: string,
    clientId: string,
    handler: (msg: Uint8Array) => void,
  ): () => void;
}

export class InMemoryPubSub implements INotePubSub {
  private subs = new Map<string, Map<string, (msg: Uint8Array) => void>>();

  publish(noteId: string, msg: Uint8Array, excludeClient?: string): void {
    const noteSubs = this.subs.get(noteId);
    if (!noteSubs) return;
    for (const [clientId, handler] of noteSubs) {
      if (clientId !== excludeClient) handler(msg);
    }
  }

  subscribe(
    noteId: string,
    clientId: string,
    handler: (msg: Uint8Array) => void,
  ): () => void {
    if (!this.subs.has(noteId)) this.subs.set(noteId, new Map());
    this.subs.get(noteId)!.set(clientId, handler);
    return () => {
      const noteSubs = this.subs.get(noteId);
      if (!noteSubs) return;
      noteSubs.delete(clientId);
      if (noteSubs.size === 0) this.subs.delete(noteId);
    };
  }
}

const COMPACT_AFTER_OPS = 100;
const EVICT_IDLE_MS = 5 * 60 * 1000;

interface NoteEntry {
  doc: Y.Doc;
  opCount: number;
  lastActive: number;
}

export function prefixMsg(type: number, data: Uint8Array): Uint8Array {
  const msg = new Uint8Array(1 + data.length);
  msg[0] = type;
  msg.set(data, 1);
  return msg;
}

export class NoteRegistry {
  private entries = new Map<string, NoteEntry>();
  private loading = new Map<string, Promise<Y.Doc>>();
  private evictTimer: ReturnType<typeof setInterval>;

  constructor(
    private readonly contentService: NoteContentService,
    private readonly pubSub: INotePubSub,
  ) {
    this.evictTimer = setInterval(() => this.evictIdle(), EVICT_IDLE_MS);
  }

  destroy(): void {
    clearInterval(this.evictTimer);
  }

  async getOrLoad(noteId: string): Promise<Y.Doc> {
    const existing = this.entries.get(noteId);
    if (existing) {
      existing.lastActive = Date.now();
      return existing.doc;
    }
    // Memoize in-flight load to prevent duplicate Y.Doc creation under concurrent awaits.
    const inFlight = this.loading.get(noteId);
    if (inFlight) return inFlight;

    const loadPromise = (async () => {
      try {
        const doc = new Y.Doc();
        const content = await this.contentService.loadNote(noteId);
        Y.transact(
          doc,
          () => {
            if (content.snapshot) Y.applyUpdate(doc, content.snapshot);
            for (const op of content.operations) Y.applyUpdate(doc, op);
          },
          "load",
        );
        this.entries.set(noteId, { doc, opCount: 0, lastActive: Date.now() });
        return doc;
      } finally {
        // Always clean up so a transient DB error doesn't permanently poison the map.
        this.loading.delete(noteId);
      }
    })();

    this.loading.set(noteId, loadPromise);
    return loadPromise;
  }

  private async applyAndPersist(
    noteId: string,
    op: Uint8Array,
    clientId: string,
  ): Promise<void> {
    const doc = await this.getOrLoad(noteId);
    Y.applyUpdate(doc, op);
    const entry = this.entries.get(noteId)!;
    entry.opCount += 1;
    entry.lastActive = Date.now();
    await this.contentService.appendOperation(noteId, op);
    this.pubSub.publish(noteId, prefixMsg(0x02, op), clientId);
    if (entry.opCount >= COMPACT_AFTER_OPS) {
      entry.opCount = 0;
      this.triggerCompaction(noteId, doc).catch((err) => {
        console.error(err);
        // Restore threshold so compaction retriggers after another cycle.
        const e = this.entries.get(noteId);
        if (e) e.opCount = COMPACT_AFTER_OPS;
      });
    }
  }

  async applyOnly(
    noteId: string,
    op: Uint8Array,
    clientId: string,
  ): Promise<void> {
    // Sync step 2: client delta for ops the server was missing. Persist so
    // server restart doesn't lose state that peers already received.
    return this.applyAndPersist(noteId, op, clientId);
  }

  async applyAndBroadcast(
    noteId: string,
    op: Uint8Array,
    clientId: string,
  ): Promise<void> {
    // Incremental update from client. Broadcast as type 0x02.
    return this.applyAndPersist(noteId, op, clientId);
  }

  async triggerCompaction(noteId: string, doc: Y.Doc): Promise<void> {
    const mergedData = Y.encodeStateAsUpdate(doc);
    const stateVector = Y.encodeStateVector(doc);
    await this.contentService.compact(noteId, mergedData, stateVector);
  }

  async getDeltaForClient(
    noteId: string,
    clientStateVector: Uint8Array,
  ): Promise<Uint8Array> {
    const doc = await this.getOrLoad(noteId);
    return Y.encodeStateAsUpdate(doc, clientStateVector);
  }

  evictIdle(): void {
    const now = Date.now();
    for (const [noteId, entry] of this.entries) {
      if (now - entry.lastActive > EVICT_IDLE_MS) {
        this.entries.delete(noteId);
      }
    }
  }
}
