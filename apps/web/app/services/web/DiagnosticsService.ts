import { local } from "~/api-client/eden";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";

export class DiagnosticsService implements IDiagnosticsService {
  async healthcheck() {
    const { data, error } = await local.api.healthcheck.get();
    if (error) throw error;
    return data!;
  }
}
