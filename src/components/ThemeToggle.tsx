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
      className="relative flex h-8 w-14 shrink-0 items-center rounded-full border border-border bg-surface-secondary px-1 transition-colors"
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white transition-transform duration-200",
          isLight ? "translate-x-6" : "translate-x-0"
        )}
      >
        {isLight ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
