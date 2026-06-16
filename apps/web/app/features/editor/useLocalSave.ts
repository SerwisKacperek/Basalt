import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { useServices } from "~/services/ServiceContext";

const COMPACT_AFTER_UPDATES = 100;
const COMPACT_IDLE_MS = 30_000;

export type LocalSaveStatus = "idle" | "saving" | "locally_saved" | "error";

export interface LocalSaveState {
  localSaveStatus: LocalSaveStatus;
  localSaveError: Error | null;
  lastLocalSavedAt: number | null;
  retry: () => void;
}

export function useLocalSave(noteId: string, doc: Y.Doc): LocalSaveState {
  const { editorPersistence } = useServices();
  const [localSaveStatus, setLocalSaveStatus] = useState<LocalSaveStatus>("idle");
  const [localSaveError, setLocalSaveError] = useState<Error | null>(null);
  const [lastLocalSavedAt, setLastLocalSavedAt] = useState<number | null>(null);

  const updateCountRef = useRef(0);
  const compactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());
  const inFlightRef = useRef(0);

  const runWrite = useCallback((task: () => Promise<void>) => {
    inFlightRef.current += 1;
    setLocalSaveStatus("saving");
    writeChainRef.current = writeChainRef.current
      .then(task)
      .then(() => {
        inFlightRef.current -= 1;
        if (inFlightRef.current === 0) {
          const now = Date.now();
          setLocalSaveStatus("locally_saved");
          setLastLocalSavedAt(now);
          setLocalSaveError(null);
        }
      })
      .catch((e: unknown) => {
        inFlightRef.current -= 1;
        setLocalSaveStatus("error");
        setLocalSaveError(e instanceof Error ? e : new Error(String(e)));
      });
  }, []);

  const compact = useCallback(() => {
    updateCountRef.current = 0;
    if (compactTimerRef.current) {
      clearTimeout(compactTimerRef.current);
      compactTimerRef.current = null;
    }
    const mergedData = Y.encodeStateAsUpdate(doc);
    const stateVector = Y.encodeStateVector(doc);
    runWrite(() => editorPersistence.compact(noteId, mergedData, stateVector));
  }, [doc, noteId, editorPersistence, runWrite]);

  const retry = useCallback(() => compact(), [compact]);

  useEffect(() => {
    const scheduleCompact = () => {
      if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
      compactTimerRef.current = setTimeout(compact, COMPACT_IDLE_MS);
    };

    const onUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === "load") return;
      runWrite(() => editorPersistence.appendOperation(noteId, update));
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
  }, [noteId, doc, editorPersistence, runWrite, compact]);

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

  return { localSaveStatus, localSaveError, lastLocalSavedAt, retry };
}
