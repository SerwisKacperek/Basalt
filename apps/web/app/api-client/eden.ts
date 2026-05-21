import { clientFactory } from "@basalt/api";

export const local = clientFactory(
  __TARGET__ === "electron"
    ? "api://app"
    : (import.meta.env.VITE_BACKEND_URL ?? window.location.origin),
);
