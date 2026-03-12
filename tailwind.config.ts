import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#03030a",
        surface: "#0b0b16",
        card: "#101022",
        border: "rgba(255,255,255,0.08)",
        accent: {
          100: "#fdf2e9",
          200: "#f9d9c2",
          300: "#f5c199",
          400: "#f0a871",
          500: "#ec8f48",
          600: "#cc7130",
        },
        neon: {
          pink: "#ff5ecd",
          blue: "#5ed0ff",
          green: "#7dffb0",
          amber: "#ffb454",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 60px rgba(255, 94, 205, 0.25)",
        inset: "inset 0 0 0 1px rgba(255,255,255,0.05)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(255, 94, 205, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 94, 205, 0.35)" },
        },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        pulseGlow: "pulseGlow 4s ease-in-out infinite",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
        heroGradient:
          "linear-gradient(125deg, rgba(255,94,205,0.25), rgba(125,255,176,0.15), rgba(94,208,255,0.25))",
      },
    },
  },
  plugins: [forms, tailwindcssAnimate],
};

export default config;
