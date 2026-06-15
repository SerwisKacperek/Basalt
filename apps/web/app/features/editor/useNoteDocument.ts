import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { useServices } from "~/services/ServiceContext";

const COMPACT_AFTER_UPDATES = 100;
const COMPACT_IDLE_MS = 30_000;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface NoteDocument {
  /** The Yjs document bound to the editor via the Collaboration extension. */
  doc: Y.Doc;
  /** True once the persisted history has been replayed into `doc`. */
  ready: boolean;
  /** Set when loading the persisted history failed (never hangs on loading). */
  loadError: Error | null;
  status: SaveStatus;
  error: Error | null;
  /** Re-persist the current document state after a save failure. */
  retry: () => void;
  /** Retry loading the persisted history after a load failure. */
  reload: () => void;
}

/**
 * Owns the Yjs document lifecycle for a single note: loads the persisted
 * snapshot + operations, streams local edits back to storage, and compacts
 * the operation log. Surfaces save status / errors instead of swallowing
 * them, and flushes a final snapshot when the tab is hidden or unmounts.
 */
export function useNoteDocument(id: string): NoteDocument {
  const { editorPersistence, syncService } = useServices();
  const [doc] = useState(() => new Y.Doc());
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const updateCountRef = useRef(0);
  const compactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Serializes writes so they hit storage in order; a failure is recovered so
  // later writes (and retries) can still run.
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());
  const inFlightRef = useRef(0);

  const runWrite = useCallback((task: () => Promise<void>) => {
    inFlightRef.current += 1;
    setStatus("saving");
    writeChainRef.current = writeChainRef.current
      .then(task)
      .then(() => {
        inFlightRef.current -= 1;
        if (inFlightRef.current === 0) {
          setStatus("saved");
          setError(null);
        }
      })
      .catch((e: unknown) => {
        inFlightRef.current -= 1;
        setStatus("error");
        setError(e instanceof Error ? e : new Error(String(e)));
      });
  }, []);

  // Persist the full current state. Used for compaction and for recovery, since
  // a CRDT snapshot supersedes any individual operation that failed to save.
  const compact = useCallback(() => {
    updateCountRef.current = 0;
    if (compactTimerRef.current) {
      clearTimeout(compactTimerRef.current);
      compactTimerRef.current = null;
    }
    const mergedData = Y.encodeStateAsUpdate(doc);
    const stateVector = Y.encodeStateVector(doc);
    runWrite(() => editorPersistence.compact(id, mergedData, stateVector));
  }, [doc, id, editorPersistence, runWrite]);

  const retry = useCallback(() => compact(), [compact]);
  const reload = useCallback(() => setLoadAttempt((n) => n + 1), []);

  // Load persisted snapshot + operations. Always resolves to either `ready` or
  // `loadError`, so the editor never hangs on an indefinite loading state.
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

  // Stream local edits to storage and schedule compaction.
  useEffect(() => {
    const scheduleCompact = () => {
      if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
      compactTimerRef.current = setTimeout(compact, COMPACT_IDLE_MS);
    };

    const onUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === "load") return;
      runWrite(() => editorPersistence.appendOperation(id, update));
      updateCountRef.current += 1;
      if (updateCountRef.current >= COMPACT_AFTER_UPDATES) compact();
      else scheduleCompact();
    };

    doc.on("update", onUpdate);
    return () => {
      doc.off("update", onUpdate);
      if (compactTimerRef.current) {
        clearTimeout(compactTimerRef.current);
        compactTimerRef.current = null;
      }
    };
  }, [id, doc, editorPersistence, runWrite, compact]);

  // Connect to WS sync after local state is loaded. Disconnect on note change or unmount.
  useEffect(() => {
    if (!ready) return;
    syncService.connect(id, doc);
    return () => syncService.disconnect();
  }, [id, doc, ready, syncService]);

  // Flush a final snapshot when the page is hidden or unmounted so a pending
  // (debounced) compaction is not lost.
  useEffect(() => {
    const flush = () => {
      if (updateCountRef.current > 0) compact();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [compact]);

  return { doc, ready, loadError, status, error, retry, reload };
}
