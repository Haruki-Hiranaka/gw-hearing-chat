import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF6EF",
        ink: "#1A1512",
        sumi: "#2B2623",
        vermillion: "#C0392B",
        vermillionDeep: "#8E2A1E",
        matcha: "#5A6B4A",
        mist: "#E8E1D4",
        faded: "#6E655B",
      },
      fontFamily: {
        mincho: ['"Shippori Mincho B1"', '"Noto Serif JP"', "serif"],
        gothic: ['"Zen Kaku Gothic New"', '"Noto Sans JP"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        paper: "0 1px 0 rgba(26,21,18,0.04), 0 12px 28px -16px rgba(26,21,18,0.18)",
        stamp: "0 0 0 1px rgba(192,57,43,0.4), 0 2px 6px -2px rgba(192,57,43,0.35)",
      },
      animation: {
        "fade-up": "fadeUp 420ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
