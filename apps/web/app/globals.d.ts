import type { ServiceRegistry } from "~/services/ServiceContext";

declare global {
  const __TARGET__: "web" | "electron";

  interface Window {
    basalt?: {
      platform: NodeJS.Platform;
      services?: Partial<ServiceRegistry>;
    };
  }
}

export {};
