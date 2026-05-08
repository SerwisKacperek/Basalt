# Installation

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Docker](https://docker.com) (for the Postgres database)

## Setup

```sh
git clone https://github.com/SerwisKacperek/Basalt
cd Basalt
bun install
```

## Start the database

```sh
docker compose up -d db
```

Create `apps/api/.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/basalt
API_PORT=3000
```

## Development

Run everything:

```sh
bun dev
```

Or run individual apps:

```sh
# API only (http://localhost:3000)
bun run dev --filter=@basalt/api

# Web only (http://localhost:5173)
bun run dev --filter=web

# Desktop (Electron window)
bun run dev --filter=desktop
```

## Production build

```sh
bun run build
```

Desktop distributable is produced by `electron-builder` — run `bun run build` inside `apps/desktop`.
