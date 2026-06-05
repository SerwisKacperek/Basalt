import { createContext, useContext, type ReactNode } from "react";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import type { IEditorPersistenceService } from "@basalt/core/interfaces/IEditorPersistenceService";
import type { IStorageService } from "@basalt/core/interfaces/IStorageService";

export interface ServiceRegistry {
  diagnostics: IDiagnosticsService;
  editorPersistence: IEditorPersistenceService;
  storage: IStorageService;
}

const ServiceContext = createContext<ServiceRegistry | null>(null);

export function ServiceProvider({
  value,
  children,
}: {
  value: ServiceRegistry;
  children: ReactNode;
}) {
  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

export function useServices(): ServiceRegistry {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error("useServices must be used inside <ServiceProvider>");
  return ctx;
}
