import type { Config } from "tailwindcss";
import preset from "./src/tailwind/preset";

const config: Config = {
  presets: [preset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
