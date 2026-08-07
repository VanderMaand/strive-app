import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A1120",
        surface: "#111A2C",
        "surface-alt": "#16223A",
        "surface-line": "#233355",
        ink: "#E7EDF7",
        muted: "#7C8AAA",
        trace: "#22D3C8",
        "trace-dim": "#0F5C58",
        amber: "#F2A65A",
        coral: "#F2545B",
        leaf: "#4ADE80",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(35,51,85,0.6), 0 20px 40px -24px rgba(0,0,0,0.6)",
        glow: "0 0 24px -6px rgba(34,211,200,0.55)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
      },
      animation: {
        scan: "scan 2.4s linear infinite",
        pulseDot: "pulseDot 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
