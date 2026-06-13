import { ipcRenderer } from "electron";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import type {
  EditorNote,
  IEditorPersistenceService,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import type { IWorkspaceService } from "@basalt/core/interfaces/IWorkspaceService";
import type { IFolderService } from "@basalt/core/interfaces/IFolderService";
import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { Select, Insert, Filters } from "@basalt/domain";
import { IStorageService } from "@basalt/core/interfaces/IStorageService";
import { CHANNELS } from "./channels";
import type { PreferenceSchema } from "@basalt/domain/schema/storage";
export interface RendererServiceBridge {
  diagnostics: IDiagnosticsService;
  editorPersistence: IEditorPersistenceService;
  storage: IStorageService<PreferenceSchema>;
  workspaces: IWorkspaceService;
  folders: IFolderService;
  notes: INoteService;
}

export function buildRendererBridge(): RendererServiceBridge {
  return {
    diagnostics: {
      healthcheck: () => ipcRenderer.invoke(CHANNELS.diagnostics.healthcheck),
    },
    storage: {
      saveData: (data) => ipcRenderer.invoke(CHANNELS.preferences.save, data),
      getData: () => ipcRenderer.invoke(CHANNELS.preferences.get),
    },
    editorPersistence: {
      listNotes: () =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.list) as Promise<EditorNote[]>,
      createNote: (name: string) =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.create, name) as Promise<EditorNote>,
      deleteNote: (id: string) =>
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
      reset: () =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.reset) as Promise<void>,
    },
    workspaces: {
      findAll: (filters?: Filters<Select<"workspaces">>) =>
        ipcRenderer.invoke(CHANNELS.workspaces.findAll, filters) as Promise<Select<"workspaces">[]>,
      findById: (id: string) =>
        ipcRenderer.invoke(CHANNELS.workspaces.findById, id) as Promise<Select<"workspaces">>,
      create: (dto: Insert<"workspaces">) =>
        ipcRenderer.invoke(CHANNELS.workspaces.create, dto) as Promise<Select<"workspaces">>,
      update: (id: string, dto: Partial<Insert<"workspaces">>) =>
        ipcRenderer.invoke(CHANNELS.workspaces.update, id, dto) as Promise<Select<"workspaces">>,
      delete: (id: string) =>
        ipcRenderer.invoke(CHANNELS.workspaces.delete, id) as Promise<void>,
    },
    folders: {
      findAll: (filters?: Filters<Select<"folders">>) =>
        ipcRenderer.invoke(CHANNELS.folders.findAll, filters) as Promise<Select<"folders">[]>,
      findById: (id: string) =>
        ipcRenderer.invoke(CHANNELS.folders.findById, id) as Promise<Select<"folders">>,
      create: (dto: Insert<"folders">) =>
        ipcRenderer.invoke(CHANNELS.folders.create, dto) as Promise<Select<"folders">>,
      update: (id: string, dto: Partial<Insert<"folders">>) =>
        ipcRenderer.invoke(CHANNELS.folders.update, id, dto) as Promise<Select<"folders">>,
      delete: (id: string) =>
        ipcRenderer.invoke(CHANNELS.folders.delete, id) as Promise<void>,
    },
    notes: {
      findAll: (filters?: Filters<Select<"notes">>) =>
        ipcRenderer.invoke(CHANNELS.notes.findAll, filters) as Promise<Select<"notes">[]>,
      findById: (id: string) =>
        ipcRenderer.invoke(CHANNELS.notes.findById, id) as Promise<Select<"notes">>,
      create: (dto: Insert<"notes">) =>
        ipcRenderer.invoke(CHANNELS.notes.create, dto) as Promise<Select<"notes">>,
      update: (id: string, dto: Partial<Insert<"notes">>) =>
        ipcRenderer.invoke(CHANNELS.notes.update, id, dto) as Promise<Select<"notes">>,
      delete: (id: string) =>
        ipcRenderer.invoke(CHANNELS.notes.delete, id) as Promise<void>,
    },
  };
}
