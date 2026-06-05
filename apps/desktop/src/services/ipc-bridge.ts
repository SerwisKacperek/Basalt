import { ipcRenderer } from "electron";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import type {
  EditorDocument,
  IEditorPersistenceService,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import { IPreferencesService } from "./PreferencesService"; 
import { CHANNELS } from "./channels";

export interface RendererServiceBridge {
  diagnostics: IDiagnosticsService;
  editorPersistence: IEditorPersistenceService;
  preferences: IPreferencesService; 
}

export function buildRendererBridge(): RendererServiceBridge {
  return {
    diagnostics: {
      healthcheck: () => ipcRenderer.invoke(CHANNELS.diagnostics.healthcheck),
    },
     preferences: { 
      save: (data) => ipcRenderer.invoke(CHANNELS.preferences.save, data),
      get: () => ipcRenderer.invoke(CHANNELS.preferences.get),
    },
    editorPersistence: {
      listDocuments: () =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.list) as Promise<
          EditorDocument[]
        >,
      createDocument: (title: string) =>
        ipcRenderer.invoke(
          CHANNELS.editorPersistence.create,
          title,
        ) as Promise<EditorDocument>,
      deleteDocument: (id: string) =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.delete, id) as Promise<void>,
      loadUpdates: async (id: string) => {
        const rows = (await ipcRenderer.invoke(
          CHANNELS.editorPersistence.loadUpdates,
          id,
        )) as Uint8Array[];
        return rows.map((r) => new Uint8Array(r));
      },
      appendUpdate: (id: string, update: Uint8Array) =>
        ipcRenderer.invoke(
          CHANNELS.editorPersistence.appendUpdate,
          id,
          update,
        ) as Promise<void>,
      compact: (id: string, merged: Uint8Array) =>
        ipcRenderer.invoke(
          CHANNELS.editorPersistence.compact,
          id,
          merged,
        ) as Promise<void>,

  };
}