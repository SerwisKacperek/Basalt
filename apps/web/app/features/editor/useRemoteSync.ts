import { useEffect, useState } from "react";
import * as Y from "yjs";
import { useServices } from "~/services/ServiceContext";
import type { ConnectionStatus } from "~/services/web/SyncService";

export type RemoteSyncStatus =
  | "no-backend"
  | "connecting"
  | "pending"
  | "synced"
  | "error";

export interface RemoteSyncState {
  remoteSyncStatus: RemoteSyncStatus;
  lastSyncedAt: number | null;
}

export function useRemoteSync(
  noteId: string,
  doc: Y.Doc,
  ready: boolean,
): RemoteSyncState {
  const { syncService } = useServices();
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("idle");

  const isConfigured = syncService.isBackendConfigured();

  useEffect(() => {
    if (!ready || !isConfigured) return;
    syncService.connect(noteId, doc);
    const unsubSynced = syncService.addSyncedListener(() => {
      setLastSyncedAt(Date.now());
    });
    const unsubStatus = syncService.addStatusListener((status) => {
      setConnStatus(status);
    });
    // Capture initial status (may have already changed synchronously in connect())
    setConnStatus(syncService.connectionStatus);
    return () => {
      unsubSynced();
      unsubStatus();
      syncService.disconnect();
    };
  }, [noteId, doc, ready, syncService, isConfigured]);

  let remoteSyncStatus: RemoteSyncStatus;
  if (!isConfigured) {
    remoteSyncStatus = "no-backend";
  } else if (connStatus === "connecting" || connStatus === "idle") {
    remoteSyncStatus = "connecting";
  } else if (connStatus === "error") {
    remoteSyncStatus = "error";
  } else if (lastSyncedAt !== null) {
    remoteSyncStatus = "synced";
  } else {
    remoteSyncStatus = "pending";
  }

  return { remoteSyncStatus, lastSyncedAt };
}
