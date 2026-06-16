import { useEffect, useState } from "react";
import { useServices } from "~/services/ServiceContext";
import type { ConnectionStatus, SyncError } from "~/services/web/SyncService";

export type { ConnectionStatus, SyncError };

export interface SyncStatusState {
  status: ConnectionStatus;
  error: SyncError | null;
  isBackendConfigured: boolean;
}

export function useSyncStatus(): SyncStatusState {
  const { syncService } = useServices();
  const isBackendConfigured = syncService.isBackendConfigured();

  const [status, setStatus] = useState<ConnectionStatus>(syncService.connectionStatus);
  const [error, setError] = useState<SyncError | null>(syncService.lastError);

  useEffect(() => {
    return syncService.addStatusListener((s, e) => {
      setStatus(s);
      setError(e);
    });
  }, [syncService]);

  return { status, error, isBackendConfigured };
}
