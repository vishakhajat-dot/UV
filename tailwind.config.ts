import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0b2545",
          blue: "#13315c",
          red: "#c8102e",
          gold: "#f2a71b",
          light: "#f5f7fa",
        },
      },
    },
  },
  plugins: [],
};
export default config;
