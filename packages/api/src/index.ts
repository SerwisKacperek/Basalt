import { treaty, Treaty } from "@elysiajs/eden";
import type { App } from "@basalt/backend";

export function clientFactory(origin: string): Treaty.Create<App> {
  return treaty<App>(origin, {
    fetch: { credentials: 'include' },
  });
}

export type ApiClient = ReturnType<typeof clientFactory>;
