# Installation

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Docker](https://docker.com) (for the Postgres database)
- [PostgreSQL](https://postgresql.org) 18+ (if running the database outside of Docker)

## Setup

```sh
git clone https://github.com/SerwisKacperek/Basalt
cd Basalt
bun install
```

## Configure enviromental variables
```sh
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
```

## Start the database

```sh
docker compose -f docker-compose.dev.yml up -d db
```

## Development

Run everything:

```sh
bun dev
```

Or run individual apps:

```sh
# API only (http://localhost:3000)
bun run dev --filter=@basalt/backend

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
