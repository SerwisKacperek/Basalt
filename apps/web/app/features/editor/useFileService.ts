import { useEffect, useState } from "react";
import type { IFileService } from "@basalt/core/interfaces/IFileService";
import { useServices } from "~/services/ServiceContext";
import { RemoteFileService } from "~/services/web/FileService";

export function useFileService(noteId: string): IFileService {
  const { localFileService, notes, workspaces } = useServices();
  const [service, setService] = useState<IFileService>(localFileService);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
    if (!backendUrl) return;

    let cancelled = false;
    (async () => {
      const note = await notes.findById(noteId).catch(() => null);
      const ws = note?.workspace_id
        ? await workspaces.findById(note.workspace_id).catch(() => null)
        : null;
      if (!cancelled && ws?.type === "remote" && ws.url) {
        setService(new RemoteFileService(backendUrl));
      } else if (!cancelled) {
        setService(localFileService);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId, notes, workspaces, localFileService]);

  return service;
}
