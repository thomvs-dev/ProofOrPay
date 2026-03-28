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
        stellar: {
          blue: "#0066FF",
          dark: "#0A0B14",
          card: "#12131F",
          border: "#1E2035",
        },
      },
    },
  },
  plugins: [],
};

export default config;
