# Basalt

A local-first, cross-platform notes app. Works offline on web and desktop. Syncs across devices via a remote API.

![Cover](.github/cover.png)

## Stack

- **Web/Renderer** — React + React Router v7 + Vite
- **Desktop** — Electron (shell only; renders the web app via `app://`)
- **Backend** — Elysia + Drizzle ORM + Postgres / SQLite
- **Monorepo** — Turborepo + Bun workspaces

## Quick start

```sh
bun install
docker compose -f docker-compose.dev.yml up -d db
bun dev
```

See [docs/guide/installation](apps/docs/guide/installation.md) for full setup.

## Apps

| App | Description |
|---|---|
| `apps/web` | Renderer (PWA + Electron renderer) |
| `apps/desktop` | Electron shell |
| `apps/backend` | REST API |
| `apps/docs` | Documentation (VitePress) |

## Packages

| Package | Description |
|---|---|
| `packages/core` | Service interfaces |
| `packages/ui` | Shared React components and Tailwind presets |
| `packages/api` | Backend types exported via Eden Treaty |
| `packages/eslint-config` | Shared ESLint configs |
| `packages/typescript-config` | Shared TypeScript configs |

## Commands

```sh
bun dev              # start all apps
bun run build        # build all apps
bun run lint         # lint all packages
bun run check-types  # type-check all packages
bun run test         # run tests in applications
```
