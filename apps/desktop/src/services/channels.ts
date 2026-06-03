export const CHANNELS = {
  diagnostics: {
    healthcheck: "svc:diagnostics:healthcheck",
  },
  preferences: {
    save: "svc:preferences:save",
    get: "svc:preferences:get",
  },
} as const;
