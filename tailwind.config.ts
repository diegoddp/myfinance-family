import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        paper: "#f8fafc",
        ocean: "#0ea5e9",
        moss: "#0f766e",
        amber: "#f59e0b",
        rose: "#f43f5e"
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
