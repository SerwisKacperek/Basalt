import { vi } from "vitest";
import { diagnosticsServiceContract } from "./DiagnosticsService.contract.js";

diagnosticsServiceContract({
  name: "web",
  expectedOrigin: "http://localhost:5173",
  setup() {
    vi.stubEnv("VITE_BACKEND_URL", "http://localhost:5173");
  },
  async createService() {
    const { diagnosticsService } =
      await import("../DiagnosticsService/DiagnosticsService-web.js");
    return diagnosticsService;
  },
});
