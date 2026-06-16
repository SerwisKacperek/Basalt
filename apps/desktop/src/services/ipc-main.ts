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
  ipcMain.handle(
    CHANNELS.editorPersistence.rename,
    (_e, id: string, name: string) =>
      registry.editorPersistence.renameNote(id, name),
  );
  ipcMain.handle(CHANNELS.editorPersistence.delete, (_e, id: string) =>
    registry.editorPersistence.deleteNote(id),
  );
  ipcMain.handle(CHANNELS.editorPersistence.loadNote, (_e, id: string) =>
    registry.editorPersistence.loadNote(id),
  );
  ipcMain.handle(
    CHANNELS.editorPersistence.appendOperation,
    (_e, id: string, data: Uint8Array) =>
      registry.editorPersistence.appendOperation(id, data),
  );
  ipcMain.handle(
    CHANNELS.editorPersistence.compact,
    (_e, id: string, mergedData: Uint8Array, stateVector: Uint8Array) =>
      registry.editorPersistence.compact(id, mergedData, stateVector),
  );
  ipcMain.handle(CHANNELS.editorPersistence.reset, () =>
    registry.editorPersistence.reset(),
  );
  ipcMain.handle(
    CHANNELS.editorPersistence.getUnsyncedOperations,
    (_e, id: string) =>
      registry.editorPersistence.getUnsyncedOperations(id),
  );
  ipcMain.handle(
    CHANNELS.editorPersistence.markOperationsSynced,
    (_e, id: string, opIds: number[]) =>
      registry.editorPersistence.markOperationsSynced(id, opIds),
  );
  ipcMain.handle(
    CHANNELS.editorPersistence.syncNoteList,
    () => registry.editorPersistence.syncNoteList(),
  );

  ipcMain.handle(CHANNELS.preferences.save, (_, data) =>
    registry.preferences.saveData("app_preferences", data),
  );
  ipcMain.handle(CHANNELS.preferences.get, () =>
    registry.preferences.getData("app_preferences"),
  );

  ipcMain.handle(CHANNELS.workspaces.findAll, (_e, filters?) =>
    registry.workspaces.findAll(filters),
  );
  ipcMain.handle(CHANNELS.workspaces.findById, (_e, id: string) =>
    registry.workspaces.findById(id),
  );
  ipcMain.handle(CHANNELS.workspaces.create, (_e, dto) =>
    registry.workspaces.create(dto),
  );
  ipcMain.handle(CHANNELS.workspaces.update, (_e, id: string, dto) =>
    registry.workspaces.update(id, dto),
  );
  ipcMain.handle(CHANNELS.workspaces.delete, (_e, id: string) =>
    registry.workspaces.delete(id),
  );

  ipcMain.handle(CHANNELS.folders.findAll, (_e, filters?) =>
    registry.folders.findAll(filters),
  );
  ipcMain.handle(CHANNELS.folders.findById, (_e, id: string) =>
    registry.folders.findById(id),
  );
  ipcMain.handle(CHANNELS.folders.create, (_e, dto) =>
    registry.folders.create(dto),
  );
  ipcMain.handle(CHANNELS.folders.update, (_e, id: string, dto) =>
    registry.folders.update(id, dto),
  );
  ipcMain.handle(CHANNELS.folders.delete, (_e, id: string) =>
    registry.folders.delete(id),
  );

  ipcMain.handle(CHANNELS.notes.findAll, (_e, filters?) =>
    registry.notes.findAll(filters),
  );
  ipcMain.handle(CHANNELS.notes.findById, (_e, id: string) =>
    registry.notes.findById(id),
  );
  ipcMain.handle(CHANNELS.notes.create, (_e, dto) =>
    registry.notes.create(dto),
  );
  ipcMain.handle(CHANNELS.notes.update, (_e, id: string, dto) =>
    registry.notes.update(id, dto),
  );
  ipcMain.handle(CHANNELS.notes.delete, (_e, id: string) =>
    registry.notes.delete(id),
  );
}
