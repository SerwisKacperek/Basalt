import type { ServiceRegistry } from "./ServiceContext";

export async function createRegistry(): Promise<ServiceRegistry> {
  if (__TARGET__ === "electron") {
    const { createElectronRegistry } = await import("./electron");
    return createElectronRegistry();
  }
  const { createWebRegistry } = await import("./web");
  return createWebRegistry();
}
