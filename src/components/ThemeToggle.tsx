"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isLight}
      aria-label="Alternar tema claro/escuro"
      className="relative flex h-8 w-14 shrink-0 items-center justify-between rounded-full border border-border bg-surface-secondary px-1.5"
    >
      {/* Bolinha que desliza para indicar o lado ativo */}
      <span
        className={cn(
          "absolute left-1 top-1 h-6 w-6 rounded-full bg-primary transition-transform duration-200",
          isLight && "translate-x-6"
        )}
      />

      {/* Os dois ícones ficam sempre visíveis; o inativo aparece "apagado". */}
      <Moon className={cn("relative z-10 h-3.5 w-3.5 transition-colors", !isLight ? "text-white" : "text-text-tertiary")} />
      <Sun className={cn("relative z-10 h-3.5 w-3.5 transition-colors", isLight ? "text-white" : "text-text-tertiary")} />
    </button>
  );
}
