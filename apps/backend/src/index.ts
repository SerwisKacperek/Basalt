import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createDb, createRawDb } from "./shared/factories/db.factory";
import { logger } from "./shared/middleware";
import { noteEventBus } from "./modules/notes/note-event-bus";

import {
  healthcheckRoutes,
  createWorkspaceRoutes,
  createNoteRoutes,
  createNoteContentRoutes,
  createUserRoutes,
  createFolderRoutes
} from "./modules";

const db = createDb();
const rawDb = createRawDb(db);
const encoder = new TextEncoder();

export const createApp = () =>
  new Elysia({ prefix: "/api" })
    .use(cors())
    .use(logger)
    // TODO: This endpoint has no auth guard and broadcasts events across all
    // users/workspaces. Add authentication and workspace-scoped filtering
    // before deploying to a multi-tenant environment.
    .get("/notes/events", ({ request }) => {
      const origin = request.headers.get("Origin") ?? "*";
      let unsub: (() => void) | undefined;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(": connected\n\n"));
          unsub = noteEventBus.subscribe((event) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
            );
          });
        },
        cancel() {
          unsub?.();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": origin,
          "Vary": "Origin",
        },
      });
    })
    .use(healthcheckRoutes)
    .use(createWorkspaceRoutes(db))
    .use(createNoteRoutes(db, rawDb))
    .use(createNoteContentRoutes(rawDb))
    .use(createUserRoutes(db))
    .use(createFolderRoutes(db));

export type App = ReturnType<typeof createApp>;

const app = createApp().listen(process.env.API_PORT!);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
