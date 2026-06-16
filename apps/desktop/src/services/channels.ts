export const CHANNELS = {
  diagnostics: {
    healthcheck: "svc:diagnostics:healthcheck",
  },
  editorPersistence: {
    list: "svc:editor:list",
    create: "svc:editor:create",
    rename: "svc:editor:rename",
    delete: "svc:editor:delete",
    loadNote: "svc:editor:loadNote",
    appendOperation: "svc:editor:appendOperation",
    compact: "svc:editor:compact",
    reset: "svc:editor:reset",
    getUnsyncedOperations: "svc:editor:getUnsyncedOperations",
    markOperationsSynced: "svc:editor:markOperationsSynced",
    syncNoteList: "svc:editor:syncNoteList",
  },
  preferences: {
    save: "svc:preferences:save",
    get: "svc:preferences:get",
  },
  workspaces: {
    findAll: "svc:workspaces:findAll",
    findById: "svc:workspaces:findById",
    create: "svc:workspaces:create",
    update: "svc:workspaces:update",
    delete: "svc:workspaces:delete",
  },
  folders: {
    findAll: "svc:folders:findAll",
    findById: "svc:folders:findById",
    create: "svc:folders:create",
    update: "svc:folders:update",
    delete: "svc:folders:delete",
  },
  notes: {
    findAll: "svc:notes:findAll",
    findById: "svc:notes:findById",
    create: "svc:notes:create",
    update: "svc:notes:update",
    delete: "svc:notes:delete",
  },
} as const;
