# api

Elysia REST API for Basalt. Runs on Bun with a Postgres database via Drizzle ORM.

Package name: `@basalt/api`

## Dev

```sh
# Start Postgres first
docker compose up -d db

bun dev
```

API is available at `http://localhost:3000`.

## Environment variables

```env
DATABASE_URL=postgres://user:password@localhost:5432/basalt
API_PORT=3000
```

## Database

```sh
bun run db:generate   # generate Drizzle migrations
bun run db:migrate    # apply migrations
bun run db:studio     # open Drizzle Studio
```

## Package exports

| Export              | Description                            |
| ------------------- | -------------------------------------- |
| `.` (`@basalt/api`) | `createApp(db)` factory and `App` type |

The `createApp` factory is consumed by three hosts: the Node server, the web Service Worker, and the Electron protocol handler. Only the DB driver differs between them.
