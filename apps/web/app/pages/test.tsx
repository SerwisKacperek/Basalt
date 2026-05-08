import { useEffect, useState } from "react";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import { diagnosticsService } from "@basalt/core/services/DiagnosticsService";

type HealthData = Awaited<ReturnType<IDiagnosticsService["healthcheck"]>>;

export function Test() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    diagnosticsService.healthcheck()
      .then(setHealth)
      .catch(console.error);
  }, []);

  return (
    <div>
      <p>Page used for testing the routing <a href="/">Back to home</a></p>
      {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
    </div>
  );
}