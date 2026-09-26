"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

export type DonutDatum = { name: string; value: number };

const DONUT_COLORS = [
  "#8D6CE6", // purple
  "#7ECED4", // teal
  "#D780D6", // pink
  "#5B3FD4", // deep purple
  "#A9E6DE", // light teal
  "#EBB6E8", // light pink
  "#6D5BD0", // indigo
];

/**
 * Donut chart styled after the Finity reference: rounded segments with gaps,
 * a total in the center, and a legend that wraps independently of the chart
 * so it never breaks the circle even with many categories. When there are
 * more slices than `maxSlices`, the smallest ones are grouped into "Outros"
 * so the ring stays legible.
 */
export function DonutChart({
  data,
  maxSlices = 6,
  size = 200,
}: {
  data: DonutDatum[];
  maxSlices?: number;
  size?: number;
}) {
  const { slices, total } = useMemo(() => {
    const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
    const total = sorted.reduce((s, d) => s + d.value, 0);

    if (sorted.length <= maxSlices) return { slices: sorted, total };

    const head = sorted.slice(0, maxSlices - 1);
    const restValue = sorted.slice(maxSlices - 1).reduce((s, d) => s + d.value, 0);
    return { slices: [...head, { name: "Outros", value: restValue }], total };
  }, [data, maxSlices]);

  if (slices.length === 0) {
    return <p className="text-sm text-white/50">Nenhum gasto lançado neste mês.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={size * 0.32}
              outerRadius={size * 0.48}
              paddingAngle={3}
              cornerRadius={8}
              stroke="none"
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{
                background: "#1C1533",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 12,
              }}
              itemStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] uppercase tracking-wide text-white/50">Total</span>
          <span className="text-lg font-semibold text-white">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Legend lives in its own wrapping/scrolling area, independent of the
          chart's fixed size, so any number of categories fits without
          distorting the ring. */}
      <div className="grid max-h-[160px] w-full grid-cols-1 gap-x-4 gap-y-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {slices.map((s, i) => (
          <div key={s.name} className="flex min-w-0 items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="truncate text-white/70">{s.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-white/90">{formatCurrency(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
