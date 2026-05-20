import { afterEach, describe, expect, it, vi } from "vitest";
import type { IDiagnosticsService } from "../../interfaces/IDiagnosticsService.js";

type DiagnosticsServiceContractOptions = {
  name: string;
  expectedOrigin: string;
  createService: () => Promise<IDiagnosticsService>;
  setup?: () => void;
};

export function diagnosticsServiceContract({
  name,
  expectedOrigin,
  createService,
  setup,
}: DiagnosticsServiceContractOptions) {
  describe(`${name} diagnostics service contract`, () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it("returns healthcheck status from the local API transport", async () => {
      setup?.();

      const response = {
        status: "ok",
        timestamp: "2026-05-20T00:00:00.000Z",
      };
      const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        expect(url).toBe(`${expectedOrigin}/api/healthcheck`);

        return new Response(JSON.stringify(response), {
          headers: { "content-type": "application/json" },
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      const service = await createService();
      await expect(service.healthcheck()).resolves.toEqual(response);
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("throws when the local API transport returns an error", async () => {
      setup?.();

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          return new Response(JSON.stringify({ message: "unavailable" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }),
      );

      const service = await createService();
      await expect(service.healthcheck()).rejects.toThrow();
    });
  });
}
