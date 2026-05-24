import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        text: "var(--color-text)",
        bg: "var(--color-bg)",
        sidebar: "var(--color-sidebar)",
        primary: "var(--color-primary)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        success: "var(--color-success)",
        info: "var(--color-info)",
      },
    },
  },
  plugins: [],
};

export default preset;