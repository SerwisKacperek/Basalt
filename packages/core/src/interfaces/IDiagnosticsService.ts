export interface IDiagnosticsService {
  healthcheck(): Promise<{ status: string; timestamp: string }>;
}
