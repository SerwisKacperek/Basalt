import { Elysia, t } from "elysia";

export const healthcheckRoutes = new Elysia().get(
  "/healthcheck",
  () => ({ status: "ok", timestamp: new Date().toISOString() }),
  {
    response: t.Object({
      status: t.String(),
      timestamp: t.String(),
    }),
  },
);
