import type { Config } from "tailwindcss";
import { designTokens } from "./design-tokens";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Additional custom colors
        surface: designTokens.colors.light.surface,
        success: designTokens.colors.light.success,
        warning: designTokens.colors.light.warning,
        error: designTokens.colors.light.error,
        info: designTokens.colors.light.info,
      },
      fontFamily: {
        sans: [...designTokens.typography.fontFamily.sans] as string[],
        mono: [...designTokens.typography.fontFamily.mono] as string[],
      },
      borderRadius: {
        sm: designTokens.borderRadius.sm,
        md: designTokens.borderRadius.md,
        lg: designTokens.borderRadius.lg,
        xl: designTokens.borderRadius.xl,
      },
      transitionDuration: {
        fast: designTokens.transitions.fast,
        standard: designTokens.transitions.standard,
        slow: designTokens.transitions.slow,
      },
      transitionTimingFunction: {
        "in": designTokens.transitions.easing.in,
        "out": designTokens.transitions.easing.out,
        "in-out": designTokens.transitions.easing.inOut,
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;


