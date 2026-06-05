import { contextBridge } from "electron";
import { buildRendererBridge } from "./services/ipc-bridge";

contextBridge.exposeInMainWorld("basalt", {
  platform: process.platform,
  services: buildRendererBridge(),
});
