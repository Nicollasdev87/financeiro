"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/chartColors";

export type StackedBarDatum = { name: string; value: number };

/**
 * Uma única barra horizontal dividida proporcionalmente por categoria,
 * 100% da largura. Ao contrário de um donut, mais categorias nunca
 * distorcem o formato — os segmentos só ficam mais finos — e a legenda
 * pode ser ocultada.
 */
export function StackedBar({ data }: { data: StackedBarDatum[] }) {
  const [showLegend, setShowLegend] = useState(true);
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, d) => s + d.value, 0);

  if (sorted.length === 0) {
    return <p className="text-sm text-text-secondary">Nenhum gasto lançado neste mês.</p>;
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="text-xs font-medium text-text-tertiary transition-colors hover:text-text"
        >
          {showLegend ? "Ocultar legenda" : "Mostrar legenda"}
        </button>
      </div>

      <div className="flex h-8 w-full overflow-visible rounded-full bg-background-secondary">
        {sorted.map((d, i) => {
          const pct = (d.value / total) * 100;
          return (
            <div
              key={d.name}
              className="group relative h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            >
              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-control border border-border-strong bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-secondary opacity-0 shadow-card transition-opacity duration-150 group-hover:opacity-100">
                {d.name}: {formatCurrency(d.value)} : {pct.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>

      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((d, i) => (
            <div key={d.name} className="flex min-w-0 items-center gap-2 text-sm">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate text-text-secondary">{d.name}</span>
              <span className="ml-auto shrink-0 tabular-nums text-text">
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
