import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FORGE design tokens (per spec)
        base: {
          deepest: "#04050d",
          deep: "#05060f",
          panel: "#0a0d1e",
        },
        bg: {
          void: "#020617",
          surface: "#0f172a",
          elevated: "#1e293b",
          input: "rgba(255,255,255,0.05)",
        },
        ink: {
          hi: "#eef0fb",
          mid: "rgba(238,240,251,0.66)",
          low: "rgba(238,240,251,0.42)",
        },
        slate2: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
        accent: {
          violet: "#a78bfa",
          blue: "#38bdf8",
          green: "#4ade80",
          amber: "#fbbf24",
          red: "#f87171",
          cyan: "#38bdf8",
          indigo: "#818cf8",
          purple: "#c084fc",
        },
        semantic: {
          success: "#4ade80",
          warning: "#fbbf24",
          error: "#f87171",
          info: "#38bdf8",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "1.4" }],
        xs2: ["13px", { lineHeight: "1.5" }],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        xl2: "20px",
      },
      boxShadow: {
        sm2: "0 1px 2px rgba(0,0,0,0.3)",
        md2: "0 4px 12px rgba(0,0,0,0.4)",
        lg2: "0 8px 24px rgba(0,0,0,0.5)",
        "glow-cyan": "0 0 20px rgba(56,189,248,0.15)",
        "glow-indigo": "0 0 30px rgba(129,140,248,0.10)",
        "glow-cyan-lg": "0 0 30px rgba(56,189,248,0.08)",
        "hover-card": "0 4px 20px rgba(56,189,248,0.10)",
        "focus-input": "0 0 0 2px rgba(56,189,248,0.2), 0 0 20px rgba(56,189,248,0.15)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "400ms",
        spring: "500ms",
      },
      animation: {
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "fade-up": "fadeUp .55s cubic-bezier(.2,.7,.3,1) both",
        float: "float 5.5s ease-in-out infinite",
        shimmer: "shimmer 4.5s linear infinite",
        "glow-pulse": "glowPulse 3.2s ease-in-out infinite",
        // FORGE spec animations
        "pulse-ring": "pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-in": "slideIn 300ms cubic-bezier(0.4,0,0.2,1) both",
        "fade-in": "fadeIn 200ms ease-out both",
        "scale-pop": "scalePop 200ms cubic-bezier(0.34,1.56,0.64,1) both",
      },
      keyframes: {
        pulseSoft: {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        glowPulse: {
          "0%,100%": { opacity: "0.55", filter: "drop-shadow(0 0 8px rgba(143,163,255,0.35))" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 16px rgba(143,163,255,0.7))" },
        },
        // FORGE spec keyframes
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "100%": { transform: "scale(1.2)", opacity: "0" },
        },
        slideIn: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scalePop: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
