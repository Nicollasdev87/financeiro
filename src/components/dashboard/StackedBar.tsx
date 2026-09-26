"use client";

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
 * segments just get thinner, and the legend below wraps on its own.
 */
export function StackedBar({ data }: { data: StackedBarDatum[] }) {
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, d) => s + d.value, 0);

  if (sorted.length === 0) {
    return <p className="text-sm text-white/50">Nenhum gasto lançado neste mês.</p>;
  }

  return (
    <div className="w-full">
      <div className="flex h-8 w-full overflow-hidden rounded-full bg-white/5">
        {sorted.map((d, i) => (
          <div
            key={d.name}
            title={`${d.name}: ${formatCurrency(d.value)}`}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(d.value / total) * 100}%`,
              backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
            }}
          />
        ))}
      </div>

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
    </div>
  );
}
