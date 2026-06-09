import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        avocado: {
          50: "#f5f8e9",
          100: "#e6efc8",
          200: "#cfe49b",
          300: "#afd15f",
          400: "#8db63c",
          500: "#6f982b",
          600: "#557821",
          700: "#405c1d",
          800: "#33491d",
          900: "#263719"
        },
        cream: "#fff9e8",
        seed: "#d5a443",
        ink: "#162016"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(38, 55, 25, 0.12)",
        lift: "0 16px 34px rgba(38, 55, 25, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
