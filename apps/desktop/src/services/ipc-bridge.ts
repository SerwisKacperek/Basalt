import { ipcRenderer } from "electron";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import type {
  EditorNote,
  IEditorPersistenceService,
  NoteContent,
} from "@basalt/core/interfaces/IEditorPersistenceService";
import type { IWorkspaceService } from "@basalt/core/interfaces/IWorkspaceService";
import type { IFolderService } from "@basalt/core/interfaces/IFolderService";
import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { IAiService, AiConfig } from "@basalt/core/interfaces/IAiService";
import type { IFileService } from "@basalt/core/interfaces/IFileService";
import type { Select, Insert, Filters } from "@basalt/domain";
import { IStorageService } from "@basalt/core/interfaces/IStorageService";
import { CHANNELS } from "./channels";
import type { PreferenceSchema } from "@basalt/domain/schema/storage";
export interface RendererServiceBridge {
  diagnostics: IDiagnosticsService;
  editorPersistence: IEditorPersistenceService;
  storage: IStorageService<PreferenceSchema>;
  ai: IAiService;
  workspaces: IWorkspaceService;
  folders: IFolderService;
  notes: INoteService;
  localFileService: IFileService;
}

type AiResult<T> = { ok: true; value: T } | { ok: false; error: string };

async function unwrapAi<T>(invocation: Promise<AiResult<T>>): Promise<T> {
  const result = await invocation;
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

export function buildRendererBridge(): RendererServiceBridge {
  return {
    diagnostics: {
      healthcheck: () => ipcRenderer.invoke(CHANNELS.diagnostics.healthcheck),
    },
    storage: {
      saveData: (key, data) =>
        ipcRenderer.invoke(CHANNELS.preferences.save, key, data),
      getData: (key) => ipcRenderer.invoke(CHANNELS.preferences.get, key),
    },
    ai: {
      getConfig: () =>
        unwrapAi<AiConfig>(ipcRenderer.invoke(CHANNELS.ai.getConfig)),
      setConfig: (config) =>
        unwrapAi<void>(ipcRenderer.invoke(CHANNELS.ai.setConfig, config)),
      listModels: () =>
        unwrapAi<string[]>(ipcRenderer.invoke(CHANNELS.ai.listModels)),
      formatNote: (content: string) =>
        unwrapAi<string>(ipcRenderer.invoke(CHANNELS.ai.formatNote, content)),
      summarizeNote: (content: string) =>
        unwrapAi<string>(
          ipcRenderer.invoke(CHANNELS.ai.summarizeNote, content),
        ),
    },
    editorPersistence: {
      listNotes: () =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.list) as Promise<EditorNote[]>,
      createNote: (name: string) =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.create, name) as Promise<EditorNote>,
      renameNote: (id: string, name: string) =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.rename, id, name) as Promise<EditorNote>,
      deleteNote: (id: string) =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.delete, id) as Promise<void>,
      loadNote: async (id: string): Promise<NoteContent> => {
        const result = (await ipcRenderer.invoke(
          CHANNELS.editorPersistence.loadNote,
          id,
        )) as { snapshot: Uint8Array | null; snapshotId: string | null; operations: Uint8Array[] };
        return {
          snapshot: result.snapshot ? new Uint8Array(result.snapshot) : null,
          snapshotId: result.snapshotId,
          operations: result.operations.map((op) => new Uint8Array(op)),
        };
      },
      appendOperation: (id: string, data: Uint8Array) =>
        ipcRenderer.invoke(
          CHANNELS.editorPersistence.appendOperation,
          id,
          data,
        ) as Promise<void>,
      compact: (id: string, mergedData: Uint8Array, stateVector: Uint8Array) =>
        ipcRenderer.invoke(
          CHANNELS.editorPersistence.compact,
          id,
          mergedData,
          stateVector,
        ) as Promise<void>,
      reset: () =>
        ipcRenderer.invoke(CHANNELS.editorPersistence.reset) as Promise<void>,
      getUnsyncedOperations: async (id: string) => {
        const rows = (await ipcRenderer.invoke(
          CHANNELS.editorPersistence.getUnsyncedOperations,
          id,
        )) as { id: number; data: Uint8Array }[];
        return rows.map((r) => ({ id: r.id, data: new Uint8Array(r.data) }));
      },
      markOperationsSynced: (id: string, opIds: number[]) =>
        ipcRenderer.invoke(
          CHANNELS.editorPersistence.markOperationsSynced,
          id,
          opIds,
        ) as Promise<void>,
      syncNoteList: () =>
        ipcRenderer.invoke(
          CHANNELS.editorPersistence.syncNoteList,
        ) as Promise<void>,
    },
    localFileService: {
      storeFile: (data: ArrayBuffer, mimeType: string, filename: string) =>
        ipcRenderer.invoke(CHANNELS.files.store, data, mimeType, filename) as Promise<string>,
      resolveUrl: async (url: string) => url,
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
      join: (dto: Insert<"workspaces">) =>
        ipcRenderer.invoke(CHANNELS.workspaces.join, dto) as Promise<Select<"workspaces">>,
      sync: () =>
        ipcRenderer.invoke(CHANNELS.workspaces.sync) as Promise<void>,
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
