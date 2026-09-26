import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C5CFC",
          dark: "#5B3FD4",
          light: "#F1EDFF",
        },
        background: "#F8F9FC",
        surface: "#FFFFFF",
        text: {
          DEFAULT: "#17171A",
          secondary: "#6B7280",
        },
        border: "#E5E7EB",
        success: "#22A06B",
        warning: "#D99A00",
        danger: "#D64545",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        control: "10px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(23, 23, 26, 0.04), 0 1px 6px 0 rgba(23, 23, 26, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
