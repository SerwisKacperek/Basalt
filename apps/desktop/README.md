# desktop

Electron shell for Basalt. Contains no renderer source — builds `apps/web` with `VITE_TARGET=electron` and serves it via the `app://` custom protocol.

## Dev

Requires `apps/web` dependencies to be installed.

Run the desktop dev workflow from the monorepo root (recommended):

```sh
# start everything
bun dev

# or run only the desktop app
bun run dev --filter=desktop
```

## Build

```sh
bun run build
```

Builds the renderer for the `electron` target, then builds the Electron main process and packages the app with `electron-builder`. Final installers are placed in the `release/` output directory.

## Protocols

| Protocol | Purpose |
|---|---|
| `app://` | Serves the renderer bundle from `dist/web/` |
| `api://` | Routes requests to the local Elysia app (planned) |
