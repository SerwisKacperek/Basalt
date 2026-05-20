import { diagnosticsServiceContract } from "./DiagnosticsService.contract.js";

diagnosticsServiceContract({
  name: "electron",
  expectedOrigin: "api://app",
  async createService() {
    const { diagnosticsService } =
      await import("../DiagnosticsService/DiagnosticsService-electron.js");
    return diagnosticsService;
  },
});
