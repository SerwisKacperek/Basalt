# Introduction

Basalt is a local-first, cross-platform notes app. It works fully offline and syncs across devices via an optional remote API.

## Key concepts

**Local-first** — Both web and desktop work without a network connection. The remote API is only for cross-device sync; it is never required for basic use.

**Single renderer, two targets** — `apps/web` is the only renderer codebase. It builds as a PWA for the browser and as the Electron renderer for desktop. No code is duplicated.

**Symmetric transport** — The renderer always calls `fetch()` via the Eden Treaty client. Three different hosts terminate those requests:

| Context | How requests are handled |
|---|---|
| Web (offline) | Service Worker → `app.handle()` → SQLite-WASM (OPFS) |
| Desktop (offline) | `api://` protocol → `app.handle()` → better-sqlite3 |
| Sync | HTTPS → Node server → `app.handle()` → Postgres |

The same Elysia app (`createApp(db)`) runs in all three places — only the DB driver changes.

**MCP** — An embedded MCP server in the desktop app exposes AI agent tools. A hosted MCP server is available via the API for remote agents.

## Next steps

- [Installation](./installation)
- [Architecture](./architecture)
- [Configuration](./configuration)
