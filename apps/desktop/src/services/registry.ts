import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import { DiagnosticsService } from "./DiagnosticsService";

export interface MainServiceRegistry {
  diagnostics: IDiagnosticsService;
}

export function createMainRegistry(): MainServiceRegistry {
  return {
    diagnostics: new DiagnosticsService(),
  };
}
