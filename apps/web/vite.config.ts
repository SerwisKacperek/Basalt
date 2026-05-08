import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig(() => {
  const target = (process.env.VITE_TARGET ?? "web") as "web" | "electron";

  return {
    base: target === "electron" ? "./" : "/",
    define: {
      __TARGET__: JSON.stringify(target),
    },
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./app", import.meta.url)),
      },
      conditions: [target, "browser", "module", "import"],
    },
  };
});
