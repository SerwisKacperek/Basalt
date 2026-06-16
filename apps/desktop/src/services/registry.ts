import path from "node:path";
import { app } from "electron";

import { openEditorDb } from "../db/connection";
import { openDomainDb } from "../db/domain-connection";

import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import type { IEditorPersistenceService } from "@basalt/core/interfaces/IEditorPersistenceService";
import type { IAiService } from "@basalt/core/interfaces/IAiService";

import { DiagnosticsService } from "./DiagnosticsService";
import { StorageService } from "./StorageService";
import { EditorPersistenceService } from "./EditorPersistenceService";
import type { IStorageService } from "@basalt/core/interfaces/IStorageService";
import type { IWorkspaceService } from "@basalt/core/interfaces/IWorkspaceService";
import type { IFolderService } from "@basalt/core/interfaces/IFolderService";
import type { INoteService } from "@basalt/core/interfaces/INoteService";
import {
  WorkspaceRepository, WorkspaceService,
  FolderRepository, FolderService,
  NoteRepository, NoteService,
} from "@basalt/domain";
import {
  RemoteWorkspaceService,
  RemoteFolderService,
  RemoteNoteService,
  CompositeWorkspaceService,
  CompositeFolderService,
  CompositeNoteService,
  AiService,
} from "@basalt/core/services";
import { clientFactory } from "@basalt/api";
import { PreferenceSchema } from "@basalt/domain/schema/storage";

export interface MainServiceRegistry {
  diagnostics: IDiagnosticsService;
  editorPersistence: IEditorPersistenceService;
  preferences: IStorageService<PreferenceSchema>;
  ai: IAiService;
  workspaces: IWorkspaceService;
  folders: IFolderService;
  notes: INoteService;
}

function resolveApiUrl(): string | null {
  const base = process.env.API_URL;
  const port = process.env.API_PORT;
  if (!base && !port) return null;
  if (base && port && !/:\d+$/.test(base)) return `${base}:${port}`;
  return base ?? (port ? `http://localhost:${port}` : null);
}

function createApiClient() {
  const url = resolveApiUrl();
  return url ? clientFactory(url) : null;
}

export function createMainRegistry(vaultRoot: string): MainServiceRegistry {
  const dbPath = path.join(app.getPath("userData"), "basalt-editor.db");
  const domainDbPath = path.join(app.getPath("userData"), "basalt-domain.db");

  const { db, rawSqlite, reset } = openEditorDb(dbPath);
  const { db: domainDb, schema } = openDomainDb(domainDbPath);

  const localWorkspaces = new WorkspaceService(new WorkspaceRepository(domainDb, schema));
  const localFolders = new FolderService(new FolderRepository(domainDb, schema));
  const localNotes = new NoteService(new NoteRepository(domainDb, schema));

  const apiClient = createApiClient();
  const remoteFolders = apiClient ? new RemoteFolderService(apiClient) : null;
  const remoteNotes = apiClient ? new RemoteNoteService(apiClient) : null;

  const compositeNotes = new CompositeNoteService(localNotes, remoteNotes);
  compositeNotes.sync().catch((err) => console.error("[sync] notes:", err));

  const preferences = new StorageService(vaultRoot);

  return {
    diagnostics: new DiagnosticsService(apiClient),
    editorPersistence: new EditorPersistenceService(db, rawSqlite, reset, compositeNotes),
    preferences,
    ai: new AiService(preferences),
    workspaces: new CompositeWorkspaceService(
      localWorkspaces,
      (url) => new RemoteWorkspaceService(clientFactory(url)),
    ),
    folders: new CompositeFolderService(localFolders, remoteFolders),
    notes: compositeNotes,
  };
}
