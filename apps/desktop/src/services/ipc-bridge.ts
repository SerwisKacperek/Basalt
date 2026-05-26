import { ipcRenderer } from "electron";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import { CHANNELS } from "./channels";

export interface RendererServiceBridge {
  diagnostics: IDiagnosticsService;
}

export function buildRendererBridge(): RendererServiceBridge {
  return {
    diagnostics: {
      healthcheck: () => ipcRenderer.invoke(CHANNELS.diagnostics.healthcheck),
    },
  };
}
