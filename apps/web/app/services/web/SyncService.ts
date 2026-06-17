import * as Y from "yjs";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness";

function getWsBase(): string | null {
  const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
  if (!envUrl) return null;
  return envUrl.replace(/^http/, "ws");
}

function prefixMsg(type: number, data: Uint8Array): Uint8Array {
  const msg = new Uint8Array(1 + data.length);
  msg[0] = type;
  msg.set(data, 1);
  return msg;
}

const BASE_DELAY = 1_000;
const MAX_DELAY = 30_000;

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export interface SyncError {
  code: number;
  reason: string;
}

type StatusListener = (status: ConnectionStatus, error: SyncError | null) => void;

export class SyncService {
  private noteId: string | null = null;
  private doc: Y.Doc | null = null;
  private awareness: Awareness | null = null;
  private ws: WebSocket | null = null;
  private offUpdate: (() => void) | null = null;
  private offAwareness: (() => void) | null = null;
  private active = false;
  private generation = 0;
  private reconnectDelay = BASE_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private syncedListeners: Set<() => void> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private upstreamSyncedListeners: Set<(synced: boolean) => void> = new Set();
  private pendingLocalListeners: Set<(pending: boolean) => void> = new Set();

  connectionStatus: ConnectionStatus = "idle";
  lastError: SyncError | null = null;
  upstreamSynced = false;
  hasPendingLocal = false;

  isBackendConfigured(): boolean {
    return getWsBase() !== null;
  }

  addSyncedListener(cb: () => void): () => void {
    this.syncedListeners.add(cb);
    return () => this.syncedListeners.delete(cb);
  }

  addStatusListener(cb: StatusListener): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  addUpstreamSyncedListener(cb: (synced: boolean) => void): () => void {
    this.upstreamSyncedListeners.add(cb);
    return () => this.upstreamSyncedListeners.delete(cb);
  }

  addPendingLocalListener(cb: (pending: boolean) => void): () => void {
    this.pendingLocalListeners.add(cb);
    return () => this.pendingLocalListeners.delete(cb);
  }

  private _notifySynced(): void {
    for (const cb of this.syncedListeners) cb();
  }

  private _setStatus(status: ConnectionStatus, error: SyncError | null = null): void {
    this.connectionStatus = status;
    this.lastError = error;
    // Reset upstream sync on every (re)connect attempt so tooltip shows accurate state
    if (status === "connecting" || status === "idle") {
      this._setUpstreamSynced(false);
    }
    for (const cb of this.statusListeners) cb(status, error);
  }

  private _setUpstreamSynced(value: boolean): void {
    if (this.upstreamSynced === value) return;
    this.upstreamSynced = value;
    for (const cb of this.upstreamSyncedListeners) cb(value);
  }

  private _setPendingLocal(value: boolean): void {
    if (this.hasPendingLocal === value) return;
    this.hasPendingLocal = value;
    for (const cb of this.pendingLocalListeners) cb(value);
  }

  connect(noteId: string, doc: Y.Doc, awareness: Awareness): void {
    this.disconnect();
    const wsBase = getWsBase();
    if (!wsBase) return;
    this.active = true;
    this.noteId = noteId;
    this.doc = doc;
    this.awareness = awareness;
    this.reconnectDelay = BASE_DELAY;
    this.generation++;
    this.hasPendingLocal = false;
    this._setStatus("connecting");
    this._open(this.generation);
  }

  disconnect(): void {
    this.active = false;
    this.generation++;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._clearSubs();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.noteId = null;
    this.doc = null;
    this.awareness = null;
    this._setStatus("idle");
  }

  private _open(gen: number): void {
    if (!this.active || gen !== this.generation) return;
    const wsBase = getWsBase();
    if (!wsBase) return;
    const url = `${wsBase}/api/notes/${this.noteId}/ws`;
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.onopen = () => {
      if (gen !== this.generation) {
        ws.close();
        return;
      }
      this.reconnectDelay = BASE_DELAY;
      this._setStatus("connected");
      // Send sync step 1: our state vector
      ws.send(prefixMsg(0x00, Y.encodeStateVector(this.doc!)));
      // Forward local edits to server as type 0x02 (incremental update)
      const onUpdate = (update: Uint8Array, origin: unknown) => {
        if (origin === "load" || origin === "remote") return;
        if (gen !== this.generation || ws.readyState !== WebSocket.OPEN) return;
        this._setPendingLocal(true);
        ws.send(prefixMsg(0x02, update));
      };
      this.doc!.on("update", onUpdate);
      this.offUpdate = () => this.doc?.off("update", onUpdate);

      // Send initial awareness state + subscribe to future changes
      const awareness = this.awareness!;
      const sendAwareness = (clients: number[]) => {
        if (gen !== this.generation || ws.readyState !== WebSocket.OPEN) return;
        const update = encodeAwarenessUpdate(awareness, clients);
        ws.send(prefixMsg(0x04, update));
      };
      // Broadcast our own state immediately on connect
      sendAwareness([awareness.clientID]);
      const onAwarenessChange = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
        sendAwareness([...added, ...updated, ...removed]);
      };
      awareness.on("change", onAwarenessChange);
      this.offAwareness = () => {
        awareness.off("change", onAwarenessChange);
        // Notify peers our cursor is gone before closing
        if (ws.readyState === WebSocket.OPEN) {
          removeAwarenessStates(awareness, [awareness.clientID], "disconnect");
        }
      };
    };

    ws.onmessage = (ev) => {
      if (gen !== this.generation) return;
      const buf = ev.data;
      const raw =
        buf instanceof ArrayBuffer
          ? new Uint8Array(buf)
          : buf instanceof Uint8Array
            ? buf
            : null;
      if (!raw || raw.length < 1) return;
      const type = raw[0];
      const payload = raw.slice(1);
      if (type === 0x00) {
        // Server state vector → send delta server is missing
        const delta = Y.encodeStateAsUpdate(this.doc!, payload);
        ws.send(prefixMsg(0x01, delta));
        // YJS encodes an empty update as 2 bytes; anything larger means we have data for server
        if (delta.length > 2) this._setPendingLocal(true);
      } else if (type === 0x01) {
        // Server's full-state delta (sync step 2) — upstream is now caught up
        Y.applyUpdate(this.doc!, payload, "remote");
        this._setUpstreamSynced(true);
      } else if (type === 0x02) {
        // Incremental update from server/peers
        Y.applyUpdate(this.doc!, payload, "remote");
      } else if (type === 0x03) {
        // Server ACK: our changes persisted on backend
        this._setPendingLocal(false);
        this._notifySynced();
      } else if (type === 0x04) {
        // Awareness update from a peer — apply to local awareness
        applyAwarenessUpdate(this.awareness!, payload, "remote");
      }
    };

    ws.onerror = () => {
      // onclose fires after onerror; handle reconnect there
    };

    ws.onclose = (ev) => {
      if (gen !== this.generation) return;
      this._clearSubs();
      if (this.active) {
        const error: SyncError = {
          code: ev.code,
          reason: ev.reason || `Connection closed (code ${ev.code})`,
        };
        this._setStatus("error", error);
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_DELAY);
          this._setStatus("connecting");
          this._open(gen);
        }, this.reconnectDelay);
      }
    };
  }

  private _clearSubs(): void {
    if (this.offUpdate) {
      this.offUpdate();
      this.offUpdate = null;
    }
    if (this.offAwareness) {
      this.offAwareness();
      this.offAwareness = null;
    }
  }
}
