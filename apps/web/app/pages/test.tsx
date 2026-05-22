import { useEffect, useState } from "react";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import { TestComponent } from "@basalt/ui";
import { useServices } from "~/services/ServiceContext";

type HealthData = Awaited<ReturnType<IDiagnosticsService["healthcheck"]>>;

export function Test() {
  const { diagnostics } = useServices();
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    diagnostics.healthcheck()
      .then(setHealth)
      .catch(console.error);
  }, [diagnostics]);

  return (
    <div>
      <p>Page used for testing the routing <a href="/">Back to home</a></p>
      <TestComponent title="Test Card" description="Sample component from @basalt/ui" />
      {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
      {__TARGET__ === "electron" && window.electron && (
        <p>Running in Electron on {window.electron.platform}</p>
      )}
    </div>
  );
}
