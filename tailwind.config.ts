import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Fundo geral do app / fundo secundário (sidebar, painéis discretos)
        background: {
          DEFAULT: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
        },
        // Cards e superfícies elevadas
        surface: {
          DEFAULT: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          elevated: "var(--surface-elevated)",
        },
        text: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          muted: "var(--text-muted)",
        },
        border: {
          DEFAULT: "var(--border-subtle)",
          strong: "var(--border-default)",
        },
        // Azul — cor principal de ação/destaque
        primary: {
          DEFAULT: "rgb(var(--blue-active-rgb) / <alpha-value>)",
          dark: "rgb(var(--blue-dark-rgb) / <alpha-value>)",
          light: "rgb(var(--blue-primary-rgb) / 0.16)",
          accent: "rgb(var(--blue-primary-rgb) / <alpha-value>)",
          hover: "rgb(var(--blue-light-rgb) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success-rgb) / <alpha-value>)",
          light: "rgb(var(--success-light-rgb) / <alpha-value>)",
          dark: "var(--success-dark)",
        },
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
        info: "rgb(var(--blue-light-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        control: "10px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
