import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createDb } from "./connection/connection.pg";

import { healthcheckRoutes } from "./routes/healthcheck";

const db = createDb(process.env.DATABASE_URL!);

export const createApp = () =>
  new Elysia({ prefix: "/api" })
    .use(cors())
    .decorate("db", db)
    .use(healthcheckRoutes);

export type App = ReturnType<typeof createApp>;

const app = createApp().listen(process.env.API_PORT!);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
