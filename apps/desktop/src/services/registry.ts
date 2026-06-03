import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import { DiagnosticsService } from "./DiagnosticsService";
import { PreferencesService, IPreferencesService } from "./PreferencesService";

export interface MainServiceRegistry {
  diagnostics: IDiagnosticsService;
  preferences: IPreferencesService;
}

export function createMainRegistry(vaultRoot: string): MainServiceRegistry {
  return {
    diagnostics: new DiagnosticsService(),
    preferences: new PreferencesService(vaultRoot),
  };
}