export const CHANNELS = {
  diagnostics: {
    healthcheck: "svc:diagnostics:healthcheck",
  },
  editorPersistence: {
    list: "svc:editor:list",
    create: "svc:editor:create",
    delete: "svc:editor:delete",
    loadUpdates: "svc:editor:loadUpdates",
    appendUpdate: "svc:editor:appendUpdate",
    compact: "svc:editor:compact",
  },
} as const;
