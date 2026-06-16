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

  ipcMain.handle(CHANNELS.preferences.save, (_, key, data) =>
    registry.preferences.saveData(key, data),
  );
  ipcMain.handle(CHANNELS.preferences.get, (_, key) =>
    registry.preferences.getData(key),
  );

  // AI requests run here in the main process so they bypass the renderer's
  // CORS/COEP restrictions (e.g. talking to a local LM Studio / Ollama server).
  // Errors carry user-facing messages, so wrap them in a result envelope to
  // avoid Electron's "Error invoking remote method" prefix.
  const aiResult = async <T>(fn: () => Promise<T>) => {
    try {
      return { ok: true as const, value: await fn() };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
  ipcMain.handle(CHANNELS.ai.getConfig, () =>
    aiResult(() => registry.ai.getConfig()),
  );
  ipcMain.handle(CHANNELS.ai.setConfig, (_e, config) =>
    aiResult(() => registry.ai.setConfig(config)),
  );
  ipcMain.handle(CHANNELS.ai.listModels, () =>
    aiResult(() => registry.ai.listModels()),
  );
  ipcMain.handle(CHANNELS.ai.formatNote, (_e, content: string) =>
    aiResult(() => registry.ai.formatNote(content)),
  );
  ipcMain.handle(CHANNELS.ai.summarizeNote, (_e, content: string) =>
    aiResult(() => registry.ai.summarizeNote(content)),
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
