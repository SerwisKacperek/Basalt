import type { ServiceRegistry } from "./ServiceContext";
import { DiagnosticsService } from "./web/DiagnosticsService";
import { EditorPersistenceService } from "./web/EditorPersistenceService";

export function createRegistry(): ServiceRegistry {
  const injected = window.basalt?.services;
  return {
    diagnostics: injected?.diagnostics ?? new DiagnosticsService(),
    editorPersistence:
      injected?.editorPersistence ?? new EditorPersistenceService(),
  };
}
