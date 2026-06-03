import { ipcRenderer } from "electron";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import { IPreferencesService } from "./PreferencesService"; 
import { CHANNELS } from "./channels";

export interface RendererServiceBridge {
  diagnostics: IDiagnosticsService;
  preferences: IPreferencesService; 
}

export function buildRendererBridge(): RendererServiceBridge {
  return {
    diagnostics: {
      healthcheck: () => ipcRenderer.invoke(CHANNELS.diagnostics.healthcheck),
    },
    preferences: { 
      save: (data) => ipcRenderer.invoke(CHANNELS.preferences.save, data),
      get: () => ipcRenderer.invoke(CHANNELS.preferences.get),
    },
  };
}