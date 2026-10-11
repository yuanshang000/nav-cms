import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb6ff",
          400: "#598eff",
          500: "#3366ff",
          600: "#1f45f5",
          700: "#1831e1",
          800: "#1a2bb6",
          900: "#1c2c8f",
        },
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(3%, -4%, 0) scale(1.08)" },
        },
        "float-slower": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1.05)" },
          "50%": { transform: "translate3d(-4%, 3%, 0) scale(1)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(-10%, -10%) rotate(0deg) scale(1)" },
          "33%": { transform: "translate(10%, 5%) rotate(120deg) scale(1.15)" },
          "66%": { transform: "translate(-5%, 10%) rotate(240deg) scale(0.95)" },
        },
      },
      animation: {
        "float-slow": "float-slow 18s ease-in-out infinite",
        "float-slower": "float-slower 24s ease-in-out infinite",
        "spin-slow": "spin-slow 26s linear infinite",
        shimmer: "shimmer 2.2s infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        "fade-up": "fade-up 0.5s ease-out both",
        aurora: "aurora 28s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.15), 0 12px 40px -12px rgba(99,102,241,0.45)",
        "glow-lg": "0 0 0 1px rgba(99,102,241,0.2), 0 24px 70px -20px rgba(99,102,241,0.55)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
