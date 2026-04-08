import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      colors: {
        accent: "#479FFA",
        gain: "#4EBE96",
        loss: "#f87171",
        orange: "#FFA16C",
      },
    },
  },
  plugins: [],
};

export default config;
