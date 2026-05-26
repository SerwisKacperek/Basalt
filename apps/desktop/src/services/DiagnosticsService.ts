import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";

export class DiagnosticsService implements IDiagnosticsService {
  async healthcheck() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
