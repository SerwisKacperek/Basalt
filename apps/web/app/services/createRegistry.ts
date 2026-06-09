import type { ServiceRegistry } from "./ServiceContext";
import { DiagnosticsService } from "./web/DiagnosticsService";
import { EditorPersistenceService } from "./web/EditorPersistenceService";
import { LocalStorageService } from "./web/LocalStorageService";
import { createDomainDb } from "./web/DomainDbService";
import { local as apiClient } from "../api-client/eden";

import {
  NoteRepository, NoteService,
  FolderRepository, FolderService,
  WorkspaceRepository, WorkspaceService,
} from "@basalt/domain";
import {
  RemoteNoteService,
  RemoteFolderService,
  RemoteWorkspaceService,
  CompositeNoteService,
  CompositeFolderService,
  CompositeWorkspaceService,
} from "@basalt/core/services";

export function createRegistry(): ServiceRegistry {
  const injected = window.basalt?.services;

  const { db, schema } = createDomainDb();

  const localNotes = new NoteService(new NoteRepository(db, schema));
  const localFolders = new FolderService(new FolderRepository(db, schema));
  const localWorkspaces = new WorkspaceService(new WorkspaceRepository(db, schema));

  const remoteNotes = new RemoteNoteService(apiClient);
  const remoteFolders = new RemoteFolderService(apiClient);
  const remoteWorkspaces = new RemoteWorkspaceService(apiClient);

  const compositeNotes = injected?.notes ?? new CompositeNoteService(localNotes, remoteNotes);

  return {
    diagnostics: injected?.diagnostics ?? new DiagnosticsService(),
    editorPersistence: injected?.editorPersistence ?? new EditorPersistenceService(compositeNotes),
    storage: injected?.storage ?? new LocalStorageService(),
    workspaces: injected?.workspaces ?? new CompositeWorkspaceService(localWorkspaces, remoteWorkspaces),
    folders: injected?.folders ?? new CompositeFolderService(localFolders, remoteFolders),
    notes: compositeNotes,
  };
}
