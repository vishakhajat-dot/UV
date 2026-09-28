import type { Config } from "tailwindcss";

const config: Config = {
  // The site is light-only (light blue + white). "class" mode with no toggle keeps any
  // leftover dark: variants inert instead of following the visitor's OS setting.
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0b3a66",
          blue: "#1a73c8",
          primary: { DEFAULT: "#1a73c8", dark: "#135ea3" },
          sky: "#8cc8f2",
          light: "#eaf5fd",
          pale: "#f5faff",
        },
      },
    },
  },
  plugins: [],
};
export default config;
