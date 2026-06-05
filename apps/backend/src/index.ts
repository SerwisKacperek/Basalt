import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createDb } from "./shared/factories/db.factory";

import {
  healthcheckRoutes,
  createWorkspaceRoutes,
  createNoteRoutes,
  createFolderRoutes
} from "./modules";

const db = createDb();

export const createApp = () =>
  new Elysia({ prefix: "/api" })
    .use(cors())
    .use(healthcheckRoutes)
    .use(createWorkspaceRoutes(db))
    .use(createNoteRoutes(db))
    .use(createFolderRoutes(db));

export type App = ReturnType<typeof createApp>;

const app = createApp().listen(process.env.API_PORT!);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
