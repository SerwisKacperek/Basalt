import path from "node:path";
import { app } from "electron";

import { openEditorDb } from "../db/connection";
import { openDomainDb } from "../db/domain-connection";

import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import type { IEditorPersistenceService } from "@basalt/core/interfaces/IEditorPersistenceService";

import { DiagnosticsService } from "./DiagnosticsService";
import { PreferencesService, IPreferencesService } from "./PreferencesService";
import { EditorPersistenceService } from "./EditorPersistenceService";

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
} from "@basalt/core/services";
import { clientFactory } from "@basalt/api";

export interface MainServiceRegistry {
  diagnostics: IDiagnosticsService;
  editorPersistence: IEditorPersistenceService;
  preferences: IPreferencesService;
  workspaces: IWorkspaceService;
  folders: IFolderService;
  notes: INoteService;
}

function createApiClient() {
  const url = process.env.API_URL
    ?? (process.env.API_PORT ? `http://localhost:${process.env.API_PORT}` : null);
  return url ? clientFactory(url) : null;
}

export function createMainRegistry(vaultRoot: string): MainServiceRegistry {
  const dbPath = path.join(app.getPath("userData"), "basalt-editor.db");
  const domainDbPath = path.join(app.getPath("userData"), "basalt-domain.db");

  const { db, reset } = openEditorDb(dbPath);
  const { db: domainDb, schema } = openDomainDb(domainDbPath);

  const localWorkspaces = new WorkspaceService(new WorkspaceRepository(domainDb, schema));
  const localFolders = new FolderService(new FolderRepository(domainDb, schema));
  const localNotes = new NoteService(new NoteRepository(domainDb, schema));

  const apiClient = createApiClient();
  const remoteWorkspaces = apiClient ? new RemoteWorkspaceService(apiClient) : null;
  const remoteFolders = apiClient ? new RemoteFolderService(apiClient) : null;
  const remoteNotes = apiClient ? new RemoteNoteService(apiClient) : null;

  return {
    diagnostics: new DiagnosticsService(),
    editorPersistence: new EditorPersistenceService(db, reset),
    preferences: new PreferencesService(vaultRoot),
    workspaces: new CompositeWorkspaceService(localWorkspaces, remoteWorkspaces),
    folders: new CompositeFolderService(localFolders, remoteFolders),
    notes: new CompositeNoteService(localNotes, remoteNotes),
  };
}
