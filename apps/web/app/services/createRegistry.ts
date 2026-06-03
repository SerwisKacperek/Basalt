import type { ServiceRegistry } from "./ServiceContext";
import { DiagnosticsService } from "./web/DiagnosticsService";
import { LocalStorageService } from "./web/LocalStorageService";

export function createRegistry(): ServiceRegistry {
  const injected = window.basalt?.services;
  return {
    diagnostics: injected?.diagnostics ?? new DiagnosticsService(),
    storage: injected?.storage ?? new LocalStorageService(),
  };
}
