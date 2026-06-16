# Sync

> **Status:** Work in progress. The core protocol is functional for single-server deployments; distributed scaling and auth are not yet implemented.

## Overview

Each open note maintains a WebSocket connection to the backend. The protocol is a binary framing layer on top of Yjs's standard sync primitives. The server keeps an in-memory `Y.Doc` per active note (the `NoteRegistry`) and broadcasts updates to all connected clients.

## Client — `SyncService`

Source: `apps/web/app/services/web/SyncService.ts`

`SyncService` is a plain class instantiated once in `createRegistry()`. It only activates when `VITE_BACKEND_URL` is set. `useNoteDocument` calls `syncService.connect(noteId, doc)` once the local load is complete.

WebSocket URL pattern: `${wsBase}/api/notes/${noteId}/ws`
where `wsBase` = `VITE_BACKEND_URL` with `http(s)` replaced by `ws(s)`.

### Binary message protocol

All messages are prefixed with a single type byte:

| Byte | Direction | Payload | Meaning |
|---|---|---|---|
| `0x00` | C→S | `Y.encodeStateVector(doc)` | Sync Step 1 — client announces what it has |
| `0x00` | S→C | `Y.encodeStateVector(serverDoc)` | Sync Step 1 reply — server announces what it has |
| `0x01` | C→S | `Y.encodeStateAsUpdate(doc, serverSV)` | Sync Step 2 — client sends ops server is missing |
| `0x01` | S→C | `Y.encodeStateAsUpdate(serverDoc, clientSV)` | Sync Step 2 reply — server sends ops client is missing |
| `0x02` | C→S | incremental Yjs update | Live edit from this client |
| `0x02` | S→C | incremental Yjs update | Broadcast of another client's live edit |

### Handshake sequence

```
Client connects
  → send 0x00 + clientStateVector
  ← receive 0x00 + serverStateVector
  → send 0x01 + Y.encodeStateAsUpdate(doc, serverStateVector)
  ← receive 0x01 + Y.encodeStateAsUpdate(serverDoc, clientStateVector)
  → apply delta: Y.applyUpdate(doc, delta, "remote")

Live edits thereafter:
  doc "update" event (origin ≠ "remote", ≠ "load")
  → send 0x02 + update
  ← receive 0x02 from other clients
  → Y.applyUpdate(doc, update, "remote")
```

The `"remote"` origin tag prevents re-broadcasting updates that arrived from the server.

### Reconnection

Exponential backoff: `BASE_DELAY = 1s`, doubles each attempt up to `MAX_DELAY = 30s`. A generation counter prevents stale event handlers from firing after a disconnect.

## Server — `NoteRegistry`

Source: `apps/backend/src/modules/notes/note-registry.ts`

An in-memory cache of `Y.Doc` instances for currently active notes.

```ts
entries: Map<noteId, {
  doc: Y.Doc
  opCount: number
  lastActive: number
}>
```

### `getOrLoad(noteId)`

Returns the cached entry or loads from DB via `NoteContentService`. Concurrent loads for the same note are de-duplicated via a `loading: Map<noteId, Promise>`.

### `applyAndBroadcast(noteId, op, clientId)`

Used for live edits (`0x02`):
1. `Y.applyUpdate(doc, op)` — merge into in-memory doc
2. `NoteContentService.appendOperation(noteId, op)` — persist to DB
3. `pubSub.publish(noteId, op, clientId)` — broadcast to other clients

### `applyOnly(noteId, op, clientId)`

Used for sync step 2 (`0x01`) deltas from client. Also persists and broadcasts, despite the name suggesting otherwise — see [Known gaps](#known-gaps).

### Auto-compaction

Every 100 operations per note (`COMPACT_AFTER_OPS = 100`), the registry calls `triggerCompaction`:

```
Y.encodeStateAsUpdate(doc)   → mergedData
Y.encodeStateVector(doc)     → stateVector
NoteContentService.compact(noteId, mergedData, stateVector)
```

### Idle eviction

A timer runs every 5 minutes. Entries idle for more than 5 minutes (`EVICT_IDLE_MS`) are removed from the map. The next access reloads from DB.

## Server — `INotePubSub`

Source: `apps/backend/src/modules/notes/note-registry.ts`

```ts
interface INotePubSub {
  publish(noteId: string, msg: Uint8Array, excludeClient?: string): void
  subscribe(noteId: string, clientId: string, handler: (msg: Uint8Array) => void): () => void
}
```

Current implementation: `InMemoryPubSub` — a `Map<noteId, Map<clientId, handler>>`. Handlers are removed when the WebSocket closes (the unsubscribe function returned by `subscribe` is called in the WS close handler).

## Server — `NoteContentService`

Source: `apps/backend/src/modules/notes/note-content.service.ts`

Mirrors the client-side persistence model exactly (same per-note snapshot + operations table structure). Uses raw SQL with dialect-aware `?` → `$N` parameter rewriting for Postgres compatibility.

Table names follow the same pattern as the client: `note_<uuid_underscored>_snapshots` and `note_<uuid_underscored>_operations`.

## HTTP content routes

Source: `apps/backend/src/modules/notes/note-content.routes.ts`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/notes/:id/content` | Load snapshot + ops (base64 encoded) |
| `POST` | `/api/notes/:id/operations` | Append one operation |
| `POST` | `/api/notes/:id/compact` | Write new snapshot |
| `POST` | `/api/notes/:id/sync` | One-shot pull: delta if `stateVector` provided, full content otherwise |
| `WS` | `/api/notes/:id/ws` | WebSocket session |

## Data flow diagram

```
User types
  ↓
Tiptap Collaboration → Y.Doc "update" event
  ↓                              ↓
appendOperation()           SyncService 0x02
(local SQLite)              (WebSocket)
                                 ↓
                         NoteRegistry.applyAndBroadcast()
                           ↙           ↘
                  persist to DB    pubSub.publish()
                                        ↓
                              other clients ← 0x02
                                        ↓
                              Y.applyUpdate(doc, op, "remote")
```

## Note list sync (SSE)

Source: `apps/backend/src/modules/notes/note-event-bus.ts`

The backend maintains a `NoteEventBus` (in-process pub/sub). When a note is created or deleted via the HTTP CRUD routes, an event `{ type, noteId }` is emitted. `GET /api/notes/events` returns a Server-Sent Events stream; any connected client receives these events and calls `editorPersistence.syncNoteList()` to refresh local metadata.

## Known gaps

| Gap | Detail |
|---|---|
| `InMemoryPubSub` not distributed | Multi-process or multi-instance deployments won't broadcast across instances; needs Redis Pub/Sub or similar |
| `applyOnly` still persists | Despite the name, sync step 2 data is also persisted by the server, which may double-persist if the client already persisted the same ops locally |
| No auth on SSE | `GET /api/notes/events` has no auth guard; it broadcasts events across all users and workspaces |
| Server restart loses subscribers | All in-memory state (docs, subscribers) is lost on restart; clients reconnect and re-sync via the handshake |
