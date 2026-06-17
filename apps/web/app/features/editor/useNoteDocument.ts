import { useCallback, useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { useServices } from "~/services/ServiceContext";
import { useLocalSave, type LocalSaveStatus } from "./useLocalSave";
import { useRemoteSync, type RemoteSyncStatus } from "./useRemoteSync";

export type { LocalSaveStatus, RemoteSyncStatus };

export interface NoteDocument {
  doc: Y.Doc;
  awareness: Awareness;
  ready: boolean;
  loadError: Error | null;
  localSaveStatus: LocalSaveStatus;
  remoteSyncStatus: RemoteSyncStatus;
  lastLocalSavedAt: number | null;
  lastSyncedAt: number | null;
  upstreamSynced: boolean;
  hasPendingLocal: boolean;
  saveError: Error | null;
  retry: () => void;
  reload: () => void;
}

export function useNoteDocument(id: string): NoteDocument {
  const { editorPersistence } = useServices();
  const [doc] = useState(() => new Y.Doc());
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const awareness = useMemo(() => new Awareness(doc), [doc]);

  const { localSaveStatus, localSaveError, lastLocalSavedAt, retry } = useLocalSave(id, doc);
  const { remoteSyncStatus, lastSyncedAt, upstreamSynced, hasPendingLocal } = useRemoteSync(id, doc, awareness, ready);

  const reload = useCallback(() => setLoadAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setLoadError(null);
    editorPersistence
      .loadNote(id)
      .then(({ snapshot, operations }) => {
        if (cancelled) return;
        Y.transact(
          doc,
          () => {
            if (snapshot) Y.applyUpdate(doc, snapshot);
            for (const op of operations) Y.applyUpdate(doc, op);
          },
          "load",
        );
        setReady(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      cancelled = true;
    };
  }, [id, doc, editorPersistence, loadAttempt]);

  return {
    doc,
    awareness,
    ready,
    loadError,
    localSaveStatus,
    remoteSyncStatus,
    lastLocalSavedAt,
    lastSyncedAt,
    upstreamSynced,
    hasPendingLocal,
    saveError: localSaveError,
    retry,
    reload,
  };
}
