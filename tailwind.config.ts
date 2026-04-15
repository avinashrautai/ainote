import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f4efe7",
        foreground: "#241c16",
        panel: "#fffaf3",
        border: "#d8cbb8",
        accent: "#b85c38",
        accentSoft: "#f3d9cc",
        muted: "#6d6257",
        success: "#236c4a",
      },
      boxShadow: {
        card: "0 14px 40px rgba(36, 28, 22, 0.08)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
