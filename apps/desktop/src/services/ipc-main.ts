// ipc-main.ts
import { ipcMain } from "electron";
import { CHANNELS } from "./channels";
import type { MainServiceRegistry } from "./registry";

export function registerIpc(registry: MainServiceRegistry) {
  ipcMain.handle(CHANNELS.diagnostics.healthcheck, () =>
    registry.diagnostics.healthcheck(),
  );

  ipcMain.handle(CHANNELS.preferences.save, (_, data) =>
    registry.preferences.save(data),
  );
  ipcMain.handle(CHANNELS.preferences.get, () =>
    registry.preferences.get(),
  );
}