import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import type { ApiClient } from "@basalt/api";

export class DiagnosticsService implements IDiagnosticsService {
  constructor(private api: ApiClient | null) {}

  async healthcheck() {
    if (!this.api) {
      return { status: "offline", timestamp: new Date().toISOString() };
    }
    const { data, error } = await this.api.api.healthcheck.get();
    if (error || !data) throw new Error(`Healthcheck failed: ${String(error)}`);
    return data;
  }
}
