import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08090d",
        panel: "#11131a",
        muted: "#a7adbb",
        accent: "#4ade80",
        violet: "#a78bfa"
      },
      boxShadow: {
        glow: "0 0 60px rgba(74, 222, 128, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
