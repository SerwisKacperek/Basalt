import { useEffect, useState } from "react";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import { Link } from "react-router";
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
    <div className="p-6">
      <p className="mb-4">
        Page used for testing the routing <Link to="/debug">Back to debug</Link>
      </p>
      <TestComponent title="Test Card" description="Sample component from @basalt/ui" />
      {health && (
        <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950/5 p-3 text-sm">
          {JSON.stringify(health, null, 2)}
        </pre>
      )}
      {window.basalt && (
        <p className="mt-4">Running in Electron on {window.basalt.platform}</p>
      )}
    </div>
  );
}
