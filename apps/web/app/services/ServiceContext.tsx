import { createContext, useContext, type ReactNode } from "react";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import type { IEditorPersistenceService } from "@basalt/core/interfaces/IEditorPersistenceService";
import type { IStorageService } from "@basalt/core/interfaces/IStorageService";
import type { PreferenceSchema } from "@basalt/domain/schema/storage";
import type { IWorkspaceService } from "@basalt/core/interfaces/IWorkspaceService";
import type { IFolderService } from "@basalt/core/interfaces/IFolderService";
import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { IAiService } from "@basalt/core/interfaces/IAiService";
import type { IFileService } from "@basalt/core/interfaces/IFileService";
import type { SyncService } from "./web/SyncService";

export interface ServiceRegistry {
  diagnostics: IDiagnosticsService;
  editorPersistence: IEditorPersistenceService;
  storage: IStorageService<PreferenceSchema>;
  workspaces: IWorkspaceService;
  folders: IFolderService;
  notes: INoteService;
  ai: IAiService;
  syncService: SyncService;
  localFileService: IFileService;
}

const ServiceContext = createContext<ServiceRegistry | null>(null);

export function ServiceProvider({
  value,
  children,
}: {
  value: ServiceRegistry;
  children: ReactNode;
}) {
  return (
    <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>
  );
}

export function useServices(): ServiceRegistry {
  const ctx = useContext(ServiceContext);
  if (!ctx)
    throw new Error("useServices must be used inside <ServiceProvider>");
  return ctx;
}
