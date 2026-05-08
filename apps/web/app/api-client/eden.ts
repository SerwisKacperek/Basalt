import { treaty } from "@elysiajs/eden";
import type { App } from "@basalt/api";

export const local = treaty<App>(
  __TARGET__ === "electron" ? "api://app" : (import.meta.env.VITE_BACKEND_URL ?? window.location.origin),
);
