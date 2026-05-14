import { useEffect, useState } from "react";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import { diagnosticsService } from "@basalt/core/services/DiagnosticsService";
import { TestComponent } from "@basalt/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
type HealthData = Awaited<ReturnType<IDiagnosticsService["healthcheck"]>>;

export function Test() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    diagnosticsService.healthcheck()
      .then(setHealth)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <p>Page used for testing the routing <a href="/">Back to home</a></p>

      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>Sample component from @basalt/ui</CardDescription>
        </CardHeader>
        <CardContent>
          Test card
        </CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>

      <TestComponent title="Test Card" description="Sample component from @basalt/ui" />

      {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
    </div>
  );
}