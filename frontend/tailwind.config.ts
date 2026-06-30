import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nb: {
          bg: "#f4f4f0",
          card: "#ffffff",
          yellow: "#0a0a0a",
          pink: "#0a0a0a",
          green: "#1a6b45",
          orange: "#9a3412",
          blue: "#0a0a0a",
          red: "#b91c1c",
          white: "#0a0a0a",
          border: "rgba(0,0,0,0.1)",
          muted: "#5c5c5c",
        },
        pop: {
          bg: "#f4f4f0",
          surface: "#ffffff",
          text: "#0a0a0a",
          muted: "#5c5c5c",
        },
      },
      boxShadow: {
        pop: "0 1px 2px rgba(0,0,0,0.04)",
        "pop-md": "0 4px 24px rgba(0,0,0,0.06)",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "Courier New", "monospace"],
        display: ["var(--font-heading)", "Helvetica Neue", "Arial", "sans-serif"],
        body: ["var(--font-body)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderWidth: {
        "3": "1px",
      },
    },
  },
  plugins: [],
};

export default config;
