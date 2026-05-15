import { useEffect, useState } from "react";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import { diagnosticsService } from "@basalt/core/services/DiagnosticsService";
import { TestComponent, Icon } from "@basalt/ui";

type HealthData = Awaited<ReturnType<IDiagnosticsService["healthcheck"]>>;

export function Test() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    diagnosticsService.healthcheck()
      .then(setHealth)
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 space-y-8">
      <p><a href="/" className="text-blue-500 hover:underline">← Back to home</a></p>
      
      <TestComponent title="Test Card" description="Sample component from @basalt/ui" />
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Icon Component Examples</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Basic Icons</h3>
            <div className="flex gap-4 items-center">
              <Icon name="Heart" />
              <Icon name="Search" />
              <Icon name="Menu" />
              <Icon name="Settings" />
              <Icon name="Download" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Custom Sizes</h3>
            <div className="flex gap-4 items-center">
              <Icon name="Heart" size={16} />
              <Icon name="Heart" size={24} />
              <Icon name="Heart" size={32} />
              <Icon name="Heart" size={48} />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">With Colors</h3>
            <div className="flex gap-4 items-center">
              <Icon name="Heart" className="text-red-500" />
              <Icon name="AlertCircle" className="text-yellow-500" />
              <Icon name="CheckCircle" className="text-green-500" />
              <Icon name="XCircle" className="text-red-600" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Health Check Data</h2>
        {health && <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">{JSON.stringify(health, null, 2)}</pre>}
      </section>
    </div>
  );
}