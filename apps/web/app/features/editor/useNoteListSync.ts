import { useEffect, useRef } from "react";

declare const __TARGET__: string;

const API_BASE: string =
  typeof __TARGET__ !== "undefined" && __TARGET__ === "electron"
    ? "api://app"
    : (import.meta.env.VITE_BACKEND_URL ?? window.location.origin);

export function useNoteListSync(onEvent: () => void): void {
  // Ref so EventSource connects once, always calls the latest callback
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/notes/events`);
    es.onmessage = () => onEventRef.current();
    // On error the browser auto-reconnects; close+re-open would thrash, so ignore
    return () => es.close();
  }, []);
}
