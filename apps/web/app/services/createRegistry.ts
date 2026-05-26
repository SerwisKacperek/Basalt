import type { ServiceRegistry } from "./ServiceContext";
import { DiagnosticsService } from "./web/DiagnosticsService";

export function createRegistry(): ServiceRegistry {
  const injected = window.basalt?.services;
  return {
    diagnostics: injected?.diagnostics ?? new DiagnosticsService(),
  };
}
