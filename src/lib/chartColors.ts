import type { Theme } from "@/lib/theme";

/**
 * Cores literais para gráficos (recharts recebe strings de cor via props
 * de SVG, então não dá pra usar classes Tailwind/CSS variables ali).
 * Mantém a mesma paleta semântica do Design System em light/dark.
 */
export const CHART_COLORS: Record<
  Theme,
  {
    grid: string;
    axisText: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    success: string;
    danger: string;
    primary: string;
    primaryLine: string;
    warning: string;
  }
> = {
  light: {
    grid: "#E5E7EB",
    axisText: "#6B7280",
    tooltipBg: "#FFFFFF",
    tooltipBorder: "#E5E7EB",
    tooltipText: "#17171A",
    success: "#22A06B",
    danger: "#D64545",
    primary: "#7C5CFC",
    primaryLine: "#7C5CFC",
    warning: "#D99A00",
  },
  dark: {
    grid: "#3A3A3A",
    axisText: "#949491",
    tooltipBg: "#2D2D2D",
    tooltipBorder: "#3A3A3A",
    tooltipText: "#FBFCFC",
    success: "#33B669",
    danger: "#AB5646",
    primary: "#2878F8",
    primaryLine: "#3D7EDF",
    warning: "#EED146",
  },
};

export function tooltipStyle(c: (typeof CHART_COLORS)["light"]) {
  return {
    background: c.tooltipBg,
    border: `1px solid ${c.tooltipBorder}`,
    borderRadius: 12,
    color: c.tooltipText,
    fontSize: 12,
  };
}
