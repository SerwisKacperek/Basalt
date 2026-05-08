import { treaty } from "@elysiajs/eden";
import type { App } from "@basalt/api";
import type { IDiagnosticsService } from "../../interfaces/IDiagnosticsService.js";

const client = treaty<App>("api://app");

export const diagnosticsService: IDiagnosticsService = {
  async healthcheck() {
    const { data, error } = await client.api.healthcheck.get();
    if (error) throw error;
    return data!;
  },
};
