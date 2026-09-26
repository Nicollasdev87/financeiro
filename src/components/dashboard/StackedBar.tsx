"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

export type StackedBarDatum = { name: string; value: number };

const BAR_COLORS = [
  "#8D6CE6", // purple
  "#7ECED4", // teal
  "#D780D6", // pink
  "#5B3FD4", // deep purple
  "#A9E6DE", // light teal
  "#EBB6E8", // light pink
  "#6D5BD0", // indigo
];

/**
 * A single horizontal bar split proportionally by category, full width.
 * Unlike a donut, adding more categories never distorts the shape — the
 * segments just get thinner, and the legend below can be toggled off.
 */
export function StackedBar({ data }: { data: StackedBarDatum[] }) {
  const [showLegend, setShowLegend] = useState(true);
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, d) => s + d.value, 0);

  if (sorted.length === 0) {
    return <p className="text-sm text-white/50">Nenhum gasto lançado neste mês.</p>;
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="text-xs font-medium text-white/50 transition-colors hover:text-white/85"
        >
          {showLegend ? "Ocultar legenda" : "Mostrar legenda"}
        </button>
      </div>

      <div className="flex h-8 w-full overflow-visible rounded-full bg-white/5">
        {sorted.map((d, i) => {
          const pct = (d.value / total) * 100;
          return (
            <div
              key={d.name}
              className="group relative h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
            >
              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black px-3 py-1.5 text-xs font-medium text-gray-300 opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:opacity-100">
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
                style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
              />
              <span className="truncate text-white/70">{d.name}</span>
              <span className="ml-auto shrink-0 tabular-nums text-white/90">
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
