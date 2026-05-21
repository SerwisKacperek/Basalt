import { DiagnosticsService } from "../shared/DiagnosticsService";
import type { ServiceRegistry } from "../ServiceContext";

export function createWebRegistry(): ServiceRegistry {
  return {
    diagnostics: new DiagnosticsService(),
  };
}
