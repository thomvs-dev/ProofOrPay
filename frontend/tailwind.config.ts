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
          bg: "#0D0D0D",
          card: "#161616",
          yellow: "#FFE500",
          pink: "#FF3BFF",
          green: "#00FF94",
          orange: "#FF6B35",
          blue: "#3B7EFF",
          red: "#FF3B3B",
          white: "#F5F5F5",
          border: "#FFFFFF",
          muted: "#555555",
        },
        stellar: {
          blue: "#3B7EFF",
          dark: "#0D0D0D",
          card: "#161616",
          border: "#2A2A2A",
        },
      },
      boxShadow: {
        nb: "4px 4px 0px #FFFFFF",
        "nb-sm": "2px 2px 0px #FFFFFF",
        "nb-lg": "6px 6px 0px #FFFFFF",
        "nb-yellow": "4px 4px 0px #FFE500",
        "nb-yellow-lg": "6px 6px 0px #FFE500",
        "nb-pink": "4px 4px 0px #FF3BFF",
        "nb-green": "4px 4px 0px #00FF94",
        "nb-orange": "4px 4px 0px #FF6B35",
        "nb-blue": "4px 4px 0px #3B7EFF",
      },
      fontFamily: {
        mono: ["'Space Mono'", "Courier New", "monospace"],
        display: ["system-ui", "sans-serif"],
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};

export default config;
