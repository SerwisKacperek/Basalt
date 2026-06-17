// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";
var __electron_vite_injected_dirname = "E:\\Programowanie\\inne\\Basalt\\apps\\desktop";
var external = ["electron", "better-sqlite3"];
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist",
      emptyOutDir: false,
      rollupOptions: {
        input: { main: resolve(__electron_vite_injected_dirname, "src/main.ts") },
        output: { entryFileNames: "[name].js", format: "cjs" },
        external
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist",
      emptyOutDir: false,
      rollupOptions: {
        input: { preload: resolve(__electron_vite_injected_dirname, "src/preload.ts") },
        output: { entryFileNames: "[name].js", format: "cjs" },
        external
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
