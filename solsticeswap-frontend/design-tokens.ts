/**
 * Design Tokens for SolsticeSwap
 * Generated from seed: 78f18424b89276386394f52be093a44251d53f1d996a7e7390e6e12e7cb23313
 */

export const designTokens = {
  colors: {
    light: {
      primary: "#6366f1", // Indigo-500
      secondary: "#8b5cf6", // Violet-500
      accent: "#10b981", // Emerald-500
      background: "#ffffff",
      surface: "#f8fafc",
      text: {
        primary: "#0f172a",
        secondary: "#475569",
        muted: "#94a3b8",
      },
      border: "#e2e8f0",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
    dark: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#10b981",
      background: "#0f172a", // Slate-900
      surface: "#1e293b", // Slate-800
      text: {
        primary: "#f1f5f9", // Slate-100
        secondary: "#cbd5e1",
        muted: "#94a3b8",
      },
      border: "#334155",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],
      mono: ["JetBrains Mono", "monospace"],
    },
    fontSize: {
      compact: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "30px",
      },
      comfortable: {
        xs: "14px",
        sm: "16px",
        base: "18px",
        lg: "20px",
        xl: "22px",
        "2xl": "26px",
        "3xl": "32px",
      },
    },
    lineHeight: {
      compact: "1.5",
      comfortable: "1.75",
    },
    fontWeight: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
  spacing: {
    compact: {
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      6: "24px",
      8: "32px",
    },
    comfortable: {
      1: "8px",
      2: "16px",
      3: "24px",
      4: "32px",
      6: "48px",
      8: "64px",
    },
  },
  borderRadius: {
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
  },
  shadows: {
    light: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
    dark: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.4)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.4)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.4)",
    },
  },
  transitions: {
    fast: "200ms",
    standard: "300ms",
    slow: "500ms",
    easing: {
      in: "ease-in",
      out: "ease-out",
      inOut: "ease-in-out",
    },
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  container: {
    mobile: "100%",
    tablet: "672px",
    desktop: "896px",
  },
} as const;

export type DesignTokens = typeof designTokens;


