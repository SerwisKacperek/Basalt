# web

The renderer for Basalt — ships as a PWA and as the Electron renderer from a single codebase.

Built with React + React Router v7 + Vite.

## Dev

```sh
bun dev
```

Opens at `http://localhost:5173`. The Service Worker is disabled in dev; test offline behavior with `bun run preview`.

## Build targets

| Target | Command | Output |
|---|---|---|
| PWA | `VITE_TARGET=web bun run build:web` | `dist/` |
| Electron renderer | `VITE_TARGET=electron bun run build:electron` | built by `apps/desktop` |

## Environment variables

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | API base URL in dev (defaults to `window.location.origin`) |
| `VITE_TARGET` | `web` or `electron` — selects build target |
