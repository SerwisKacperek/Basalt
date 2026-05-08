# Architecture

## Monorepo layout

```
apps/
  web/        # Renderer (React + React Router + Vite) — also the PWA
  desktop/    # Electron shell only — builds web with VITE_TARGET=electron
  api/        # Elysia app + Node host + Postgres driver + MCP server
  docs/       # This documentation (VitePress)
packages/
  core/       # Domain, service interfaces, platform service implementations
  ui/         # Shared React components and Tailwind preset
  eslint-config/
  typescript-config/
```

`apps/desktop` has no renderer source. It builds `apps/web` with `VITE_TARGET=electron` and serves the output over the `app://` custom protocol.

## The API package

`apps/api` exports a `createApp(db)` factory that returns an Elysia app. Three hosts import it:

```ts
// apps/api/src/index.ts
export const createApp = () =>
  new Elysia({ prefix: '/api' })
    .use(cors())
    .use(healthcheckRoutes)

export type App = ReturnType<typeof createApp>
```

- **Node** — `createApp().listen(port)` in `apps/api/src/index.ts`
- **Service Worker** — `app.handle(request)` inside `apps/web`'s SW entry
- **Electron** — `protocol.handle('api', req => app.handle(req))` in `apps/desktop`

## Eden Treaty client

The renderer never imports Elysia runtime code. It imports only the `App` type for type-safe RPC:

```ts
// apps/web/app/api-client/eden.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '@basalt/api'

export const local = treaty<App>(
  __TARGET__ === 'electron' ? 'api://app' : (import.meta.env.VITE_BACKEND_URL ?? window.location.origin)
)
```

## Electron protocols

Two custom protocols are registered with `{ standard: true, secure: true, supportFetchAPI: true }`:

| Protocol | Purpose |
|---|---|
| `app://` | Serves the renderer bundle (HTML/JS/CSS) from `dist/` with a path-traversal guard |
| `api://` | Routes requests to `createApp(betterSqliteDriver).handle(request)` |

`file://` is never used — it breaks routing and has weaker security guarantees.

## Build targets

`apps/web/vite.config.ts` branches on `VITE_TARGET`:

- `web` (default) — enables the PWA Service Worker, sets `base: '/'`
- `electron` — disables SW, sets `base: './'`, targets Chrome 120

The build constant `__TARGET__` lets web-only code tree-shake from the Electron bundle:

```ts
if (__TARGET__ === 'web') {
  const { registerSW } = await import('virtual:pwa-register')
  registerSW()
}
```

## Core package

`packages/core` holds service interfaces (`I-prefixed`) and platform implementations. Conditional exports select the right implementation at build time:

```json
"./services/*": {
  "web": "./src/services/*/index-web.ts",
  "electron": "./src/services/*/index-electron.ts",
  "default": "./src/services/*/index.ts"
}
```

Vite picks the correct file via `resolve.conditions`. The renderer never imports concrete `*-web.ts` or `*-electron.ts` files directly.

## MCP

MCP tools wrap the service layer — never protocols directly. Two servers exist:

- **Embedded** (`apps/desktop`) — imports universal tools from `@basalt/api/mcp` plus desktop-only tools
- **Hosted** (`apps/api`) — exposes the universal tool set to remote agents

## Things to avoid

- `file://` in Electron
- Renderer importing runtime code from `@basalt/api` (type-only imports only; the SW entry is the exception)
- Native deps (`better-sqlite3`, `postgres`) in `packages/core` or other shared packages
- Defining HTTP routes outside `apps/api/src/routes/`
- Service worker enabled in dev (cache lies; test offline via `vite preview`)
