import type { ServiceRegistry } from "./ServiceContext";
import { DiagnosticsService } from "./web/DiagnosticsService";
import { EditorPersistenceService } from "./web/EditorPersistenceService";
import { LocalStorageService } from "./web/LocalStorageService";

export function createRegistry(): ServiceRegistry {
  const injected = window.basalt?.services;
  return {
    diagnostics: injected?.diagnostics ?? new DiagnosticsService(),
    editorPersistence:
      injected?.editorPersistence ?? new EditorPersistenceService(),
      storage: injected?.storage ?? new LocalStorageService(),
  };
}
