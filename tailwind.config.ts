import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0c0f14",
          800: "#121720",
          700: "#1a2230",
          600: "#243043"
        },
        slate: {
          450: "#9aa4b2"
        },
        accent: {
          500: "#9ad7ff"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 0 0 1px rgba(148,163,184,0.12), 0 10px 30px rgba(0,0,0,0.25)"
      },
      animation: {
        "spin-slow": "spin 3s linear 1"
      }
    }
  },
  plugins: []
};

export default config;
