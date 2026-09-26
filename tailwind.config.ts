import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8D6CE6",
          dark: "#5B3FD4",
          light: "rgba(141, 108, 230, 0.16)",
        },
        background: "#0B0817",
        surface: "#170F2C",
        text: {
          DEFAULT: "#F5F3FF",
          secondary: "#9C94B8",
        },
        border: "rgba(255, 255, 255, 0.12)",
        success: "#34D399",
        warning: "#FBBF24",
        danger: "#F87171",
        info: "#7DD3FC",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
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
