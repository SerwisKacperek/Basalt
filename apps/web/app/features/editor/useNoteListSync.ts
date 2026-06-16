import { useEffect, useRef } from "react";

declare const __TARGET__: string;

function getApiBase(): string | null {
  if (typeof __TARGET__ !== "undefined" && __TARGET__ === "electron") {
    return "api://app";
  }
  // Require explicit config; falling back to window.location.origin would
  // connect to the dev server instead of the backend when ports differ.
  return import.meta.env.VITE_BACKEND_URL ?? null;
}

const API_BASE = getApiBase();

export function useNoteListSync(onEvent: () => void): void {
  // Ref so EventSource connects once, always calls the latest callback
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!API_BASE) return;
    const es = new EventSource(`${API_BASE}/api/notes/events`);
    es.onmessage = () => onEventRef.current();
    // On error the browser auto-reconnects; close+re-open would thrash, so ignore
    return () => es.close();
  }, []);
}
