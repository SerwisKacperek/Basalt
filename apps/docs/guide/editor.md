# Editor

> **Status:** Work in progress. The architecture described here is the intended design; some parts (notably `synced_at` tracking) are not yet fully wired up.

## Overview

Basalt uses [Tiptap](https://tiptap.dev/) as the rich-text editor and [Yjs](https://docs.yjs.dev/) as the CRDT layer. Each note has an independent `Y.Doc` that is persisted locally and optionally synchronized to a remote backend over WebSocket.

## Component stack

```
EditorPage                          (apps/web/app/pages/editor.tsx)
  └── EditorView                    (apps/web/app/features/editor/EditorView.tsx)
        ├── useNoteDocument(id)     ← owns Y.Doc lifecycle
        ├── useEditor({ doc })      ← Tiptap instance
        ├── EditorStatusBar
        ├── EditorContent
        └── EditorToolbar
```

`useNoteDocument` is the core hook. It loads the note from local SQLite, subscribes to live Yjs updates, and drives persistence and sync. `useEditor` receives the `Y.Doc` from that hook and passes it to Tiptap's `Collaboration` extension.

Key Tiptap config:

```ts
useEditor({
  extensions: [
    StarterKit.configure({ history: false }), // Yjs owns undo history
    Collaboration.configure({ document: doc }),
    Placeholder,
  ],
})
```

`history: false` is mandatory — Tiptap's built-in undo stack conflicts with Yjs's own undo manager.

## Two SQLite databases

The renderer maintains two separate SQLite databases, each in a dedicated Web Worker (OPFS on web, `better-sqlite3` files on desktop):

| Database | OPFS name | Schema source | Contains |
|---|---|---|---|
| `basalt-domain.db` | `basalt-domain-pool` | `@basalt/domain/schema/sqlite` | Note metadata, folders, workspaces, users |
| `basalt-editor.db` | `basalt-editor-pool` | `@basalt/db/schema` | CRDT content: snapshots + operations |

The split keeps editor write traffic (which is frequent and per-keystroke) isolated from domain metadata.

## Editor DB schema

Source: `packages/db/src/schema.ts`

**Static table** (mirrors domain metadata for list queries):
```sql
notes(id, name, folder_id, workspace_id, created_at, updated_at, deleted_at)
```

**Dynamic per-note tables** (created on first use, named by note UUID with `-` → `_`):
```sql
note_<uuid>_snapshots(
  id          TEXT PRIMARY KEY,
  data        BLOB NOT NULL,        -- gzip-compressed Y.encodeStateAsUpdate(doc)
  state_vector BLOB,                -- gzip-compressed Y.encodeStateVector(doc)
  created_at  INTEGER,
  synced_at   INTEGER               -- NULL until pushed to server (not yet wired)
)

note_<uuid>_operations(
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id TEXT REFERENCES snapshots,
  data        BLOB NOT NULL,        -- gzip-compressed incremental Yjs update
  created_at  INTEGER,
  synced_at   INTEGER               -- NULL until pushed to server (not yet wired)
)
```

All blobs are gzip-compressed binary Yjs updates.

### Migration history

- **0000** — original schema used a single shared `note_updates(id, note_id, update_blob)` table.
- **0001** — JS migration `migrate_note_updates_to_per_note_tables` moved all rows into per-note tables and dropped `note_updates`. Both the web OPFS worker and the desktop `connection.ts` run this migration on startup.

## `useNoteDocument` lifecycle

Source: `apps/web/app/features/editor/useNoteDocument.ts`

### Phase 1 — Load

```
editorPersistence.loadNote(id)
  → { snapshot, snapshotId, operations }
  → Y.transact(doc, () => {
      Y.applyUpdate(doc, snapshot, "load")
      operations.forEach(op => Y.applyUpdate(doc, op, "load"))
    }, "load")
  → ready = true
```

The `"load"` origin tag prevents the update handler from treating the initial hydration as new user edits.

### Phase 2 — Stream writes

```
doc.on("update", (update, origin) => {
  if (origin === "load" || origin === "remote") return
  writeChain = writeChain.then(() =>
    editorPersistence.appendOperation(id, update)
  )
  scheduleCompact()
})
```

Writes are serialized through a promise chain (`writeChainRef`) to avoid race conditions between concurrent `appendOperation` calls.

### Phase 3 — Compaction

Triggered after **100 operations** or **30 seconds of idle** (whichever comes first), and also on page hide/visibility change:

```
Y.encodeStateAsUpdate(doc)   → mergedData
Y.encodeStateVector(doc)     → stateVector
editorPersistence.compact(id, mergedData, stateVector)
  → INSERT INTO note_<id>_snapshots ...
  → DELETE FROM note_<id>_operations WHERE id <= highWaterMark
```

Compaction collapses accumulated operations into a single snapshot row, keeping the DB small.

### Phase 4 — WS sync

Once `ready = true`, the hook calls `syncService.connect(id, doc)`. See [Sync](./sync) for the WebSocket protocol.

### Exposed state

```ts
{
  doc: Y.Doc
  ready: boolean
  loadError: Error | null
  status: 'idle' | 'saving' | 'saved' | 'error'
  error: Error | null
  retry: () => void
  reload: () => void
}
```

## `IEditorPersistenceService`

Source: `packages/core/src/interfaces/IEditorPersistenceService.ts`

```ts
interface IEditorPersistenceService {
  listNotes(): Promise<EditorNote[]>
  createNote(name: string): Promise<EditorNote>
  deleteNote(id: string): Promise<void>
  loadNote(id: string): Promise<NoteContent>
  appendOperation(id: string, data: Uint8Array): Promise<void>
  compact(id: string, mergedData: Uint8Array, stateVector: Uint8Array): Promise<void>
  reset(): Promise<void>
  getUnsyncedOperations(id: string): Promise<{ id: number; data: Uint8Array }[]>
  markOperationsSynced(id: string, opIds: number[]): Promise<void>
  syncNoteList(): Promise<void>
}
```

Two concrete implementations:

| Target | File | Transport |
|---|---|---|
| Web | `apps/web/app/services/web/EditorPersistenceService.ts` | postMessage to OPFS worker |
| Desktop | `apps/desktop/src/services/EditorPersistenceService.ts` | `better-sqlite3` via IPC |

### Desktop IPC bridge

The desktop preload script exposes a `RendererServiceBridge` via `contextBridge.exposeInMainWorld("basalt", { services })`. `createRegistry()` in the renderer checks for `window.basalt?.services`; if present, each service method becomes an `ipcRenderer.invoke(CHANNEL, ...args)` call routed to `ipcMain.handle` in the main process.

## Note list sync (SSE)

Source: `apps/web/app/features/editor/useNoteListSync.ts`

The client opens a persistent `EventSource` to `GET /api/notes/events`. The backend emits `{ type: 'created' | 'deleted', noteId }` whenever a note is mutated. On any event, the client calls `editorPersistence.syncNoteList()` → `CompositeNoteService.sync()` to pull updated metadata into local SQLite.

`CompositeNoteService.sync()` reconciles local vs. remote:
- Remote-only notes → `local.create()`
- Local-only notes → `remote.create()` (offline-created notes are pushed up)
- Shared notes → `local.update()` from remote (remote wins for metadata)

## Known gaps

| Gap | Detail |
|---|---|
| `synced_at` unused | `getUnsyncedOperations` and `markOperationsSynced` exist but are never called; `synced_at` is never written by the client |
| No metadata conflict resolution | `CompositeNoteService.sync()` blindly overwrites local metadata with remote; no timestamp/version check |
| Desktop WS URL | `SyncService` derives `ws://` from `VITE_BACKEND_URL`; in Electron the backend is on `api://`, which may not support WebSocket framing correctly |
