import { DiagnosticsService } from "../shared/DiagnosticsService";
import type { ServiceRegistry } from "../ServiceContext";

export function createElectronRegistry(): ServiceRegistry {
  return {
    diagnostics: new DiagnosticsService(),
  };
}
