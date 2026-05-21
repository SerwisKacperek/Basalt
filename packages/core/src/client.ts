import { treaty } from "@elysiajs/eden";
import type { App } from "@basalt/backend";

export function createLocalClient(baseUrl: string) {
  return treaty<App>(baseUrl);
}

export type LocalClient = ReturnType<typeof createLocalClient>;
