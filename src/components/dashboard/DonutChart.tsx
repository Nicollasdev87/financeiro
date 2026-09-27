"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/chartColors";

export type DonutDatum = { name: string; value: number };

/**
 * Donut com segmentos arredondados e total no centro. A legenda fica numa
 * área própria com wrap/scroll, independente do círculo, então qualquer
 * número de categorias cabe sem distorcer o gráfico. Acima de `maxSlices`,
 * as menores são agrupadas em "Outros".
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
    return <p className="text-sm text-text-secondary">Nenhum gasto lançado neste mês.</p>;
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
              cornerRadius={6}
              stroke="none"
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: 10,
                color: "var(--text-primary)",
                fontSize: 12,
              }}
              itemStyle={{ color: "var(--text-primary)" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] uppercase tracking-wide text-text-tertiary">Total</span>
          <span className="text-lg font-semibold text-text">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="grid max-h-[160px] w-full grid-cols-1 gap-y-2 overflow-y-auto pr-1">
        {slices.map((s, i) => (
          <div key={s.name} className="flex min-w-0 items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate text-text-secondary">{s.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-text">{formatCurrency(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
