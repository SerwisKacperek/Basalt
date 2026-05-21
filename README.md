# Basalt

A local-first, cross-platform notes app. Works offline on web and desktop. Syncs across devices via a remote API.

![Cover](.github/cover.png)

## Stack

- **Web/Renderer** — React + React Router v7 + Vite
- **Desktop** — Electron (shell only; renders the web app via `app://`)
- **API** — Elysia + Drizzle ORM + Postgres
- **Monorepo** — Turborepo + Bun workspaces

## Quick start

```sh
bun install
docker compose up -d db        # start Postgres
cp apps/api/.env.example apps/api/.env  # set DATABASE_URL
bun dev
```

See [docs/guide/installation](apps/docs/guide/installation.md) for full setup.

## Apps

| App | Description |
|---|---|
| `apps/web` | Renderer (PWA + Electron renderer) |
| `apps/desktop` | Electron shell |
| `apps/api` | REST API + MCP server |
| `apps/docs` | Documentation (VitePress) |

## Packages

| Package | Description |
|---|---|
| `packages/core` | Service interfaces and platform implementations |
| `packages/ui` | Shared React components and Tailwind preset |
| `packages/eslint-config` | Shared ESLint configs |
| `packages/typescript-config` | Shared TypeScript configs |

## Commands

```sh
bun dev              # start all apps
bun run build        # build all apps
bun run lint         # lint all packages
bun run check-types  # type-check all packages
```
