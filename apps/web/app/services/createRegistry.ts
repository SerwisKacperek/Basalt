import type { ServiceRegistry } from "./ServiceContext";
import { DiagnosticsService } from "./web/DiagnosticsService";
import { EditorPersistenceService } from "./web/EditorPersistenceService";
import { StorageService } from "./web/StorageService";
import { SyncService } from "./web/SyncService";
import { createDomainDb } from "./web/DomainDbService";
import { local as apiClient } from "../api-client/eden";
import { clientFactory } from "@basalt/api";

import {
  NoteRepository,
  NoteService,
  FolderRepository,
  FolderService,
  WorkspaceRepository,
  WorkspaceService,
} from "@basalt/domain";
import {
  RemoteNoteService,
  RemoteFolderService,
  RemoteWorkspaceService,
  CompositeNoteService,
  CompositeFolderService,
  CompositeWorkspaceService,
  AiService,
} from "@basalt/core/services";

export function createRegistry(): ServiceRegistry {
  const injected = window.basalt?.services;
  const storage = injected?.storage ?? new StorageService();

  const { db, schema } = createDomainDb();

  const localNotes = new NoteService(new NoteRepository(db, schema));
  const localFolders = new FolderService(new FolderRepository(db, schema));
  const localWorkspaces = new WorkspaceService(
    new WorkspaceRepository(db, schema),
  );

  const remoteNotes = new RemoteNoteService(apiClient);
  const remoteFolders = new RemoteFolderService(apiClient);

  const compositeNotes = new CompositeNoteService(localNotes, remoteNotes);

  if (!injected) {
    compositeNotes
      .sync()
      .catch((err: unknown) => console.error("[sync] notes:", err));
  }

  return {
    diagnostics: injected?.diagnostics ?? new DiagnosticsService(),
    editorPersistence: injected?.editorPersistence ?? new EditorPersistenceService(compositeNotes),
    storage: storage,
    workspaces: injected?.workspaces ?? new CompositeWorkspaceService(
      localWorkspaces,
      (url) => new RemoteWorkspaceService(clientFactory(url)),
    ),
    folders: injected?.folders ?? new CompositeFolderService(localFolders, remoteFolders),
    notes: injected?.notes ?? compositeNotes,
    ai: injected?.ai ?? new AiService(storage),
    syncService: new SyncService(),
  };
}
