// ipc-main.ts
import { ipcMain } from "electron";
import { CHANNELS } from "./channels";
import type { MainServiceRegistry } from "./registry";

export function registerIpc(registry: MainServiceRegistry) {
  ipcMain.handle(CHANNELS.diagnostics.healthcheck, () =>
    registry.diagnostics.healthcheck(),
  );

  ipcMain.handle(CHANNELS.editorPersistence.list, () =>
    registry.editorPersistence.listNotes(),
  );
  ipcMain.handle(CHANNELS.editorPersistence.create, (_e, name: string) =>
    registry.editorPersistence.createNote(name),
  );
  ipcMain.handle(CHANNELS.editorPersistence.delete, (_e, id: string) =>
    registry.editorPersistence.deleteNote(id),
  );
  ipcMain.handle(CHANNELS.editorPersistence.loadUpdates, (_e, id: string) =>
    registry.editorPersistence.loadUpdates(id),
  );
  ipcMain.handle(
    CHANNELS.editorPersistence.appendUpdate,
    (_e, id: string, update: Uint8Array) =>
      registry.editorPersistence.appendUpdate(id, update),
  );
  ipcMain.handle(
    CHANNELS.editorPersistence.compact,
    (_e, id: string, merged: Uint8Array) =>
      registry.editorPersistence.compact(id, merged),
  );
  ipcMain.handle(CHANNELS.editorPersistence.reset, () =>
    registry.editorPersistence.reset(),
  );

  ipcMain.handle(CHANNELS.preferences.save, (_, data) =>
    registry.preferences.save(data),
  );
  ipcMain.handle(CHANNELS.preferences.get, () => registry.preferences.get());
}
