declare const __TARGET__: "web" | "electron";

interface Window {
  electron?: {
    platform: NodeJS.Platform;
  };
}
