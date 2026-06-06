import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  const target = (process.env.VITE_TARGET ?? "web") as "web" | "electron";

  const coopCoepHeaders = {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  };

  return {
    base: target === "electron" ? "./" : "/",
    define: {
      __TARGET__: JSON.stringify(target),
    },
    plugins: [
      tailwindcss(),
      react(),
      // A service worker is only meaningful for the web target. In the packaged
      // Electron app (served over the custom app:// protocol) it precaches and
      // intercepts requests, which breaks asset/route loading after a build.
      ...(target === "web"
        ? [
            VitePWA({
              manifest: false,
              includeAssets: [
                "favicon.ico",
                "apple-touch-icon.png",
                "mask-icon.svg",
                "manifest.webmanifest",
              ],
              strategies: "generateSW",
              workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
              },
            }),
          ]
        : []),
    ],
    server: { headers: coopCoepHeaders },
    preview: { headers: coopCoepHeaders },
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./app", import.meta.url)),
      },
      dedupe: ["react", "react-dom"],
      conditions: [target, "browser", "module", "import"],
    },
    build: {
      outDir: process.env.OUT_DIR ?? "dist",
      emptyOutDir: true,
    },
  };
});
