# desktop

Electron shell for Basalt. Contains no renderer source — builds `apps/web` with `VITE_TARGET=electron` and serves it via the `app://` custom protocol.

## Dev

Requires `apps/web` dependencies to be installed.

```sh
bun dev
```

This compiles TypeScript and launches Electron pointing at `http://localhost:5173` (Vite dev server must be running).

## Build

```sh
bun run build
```

Builds the renderer into `../web/dist`, copies it to `dist/web`, then packages with `electron-builder`. Outputs to `dist/`.

## Protocols

| Protocol | Purpose |
|---|---|
| `app://` | Serves the renderer bundle from `dist/web/` |
| `api://` | Routes requests to the local Elysia app (planned) |
