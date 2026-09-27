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
      className="relative flex h-8 w-14 shrink-0 items-center rounded-full border border-border bg-surface-secondary"
    >
      {/* Bolinha que desliza para indicar o lado ativo */}
      <span
        className={cn(
          "absolute left-1 top-1 h-6 w-6 rounded-full bg-primary transition-transform duration-200",
          isLight && "translate-x-6"
        )}
      />

      {/* Cada ícone ocupa a MESMA caixa 6x6 (24px) que a bolinha, na mesma
          posição (left-1 / translate-x-6) — assim ele fica sempre
          perfeitamente centralizado sobre o fundo azul, nos dois temas.
          Antes os ícones eram posicionados por justify-between (encostados
          nas bordas do padding), o que não coincidia com o centro real da
          bolinha e deixava o ícone visivelmente descentralizado. */}
      <span className="relative z-10 ml-1 flex h-6 w-6 items-center justify-center">
        <Moon className={cn("h-3.5 w-3.5 transition-colors", !isLight ? "text-white" : "text-text-tertiary")} />
      </span>
      <span className="relative z-10 flex h-6 w-6 items-center justify-center">
        <Sun className={cn("h-3.5 w-3.5 transition-colors", isLight ? "text-white" : "text-text-tertiary")} />
      </span>
    </button>
  );
}
