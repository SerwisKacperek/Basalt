import { createLocalClient } from "@basalt/core/client";

export const local = createLocalClient(
  __TARGET__ === "electron"
    ? "api://app"
    : (import.meta.env.VITE_BACKEND_URL ?? window.location.origin),
);
