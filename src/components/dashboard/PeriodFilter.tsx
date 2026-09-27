"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { MONTH_SHORT_NAMES, toMonthKey, cn } from "@/lib/utils";

export type PeriodFilterValue =
  | { mode: "year"; year: number }
  | { mode: "months"; year: number; months: number[] }; // months: 0-11, at least one

export function monthKeysFromPeriod(period: PeriodFilterValue): string[] {
  if (period.mode === "year") {
    return Array.from({ length: 12 }, (_, i) => toMonthKey(new Date(period.year, i, 1)));
  }
  return [...period.months].sort((a, b) => a - b).map((m) => toMonthKey(new Date(period.year, m, 1)));
}

function periodLabel(period: PeriodFilterValue): string {
  if (period.mode === "year") return `Ano ${period.year}`;
  const sorted = [...period.months].sort((a, b) => a - b);
  if (sorted.length === 0) return "Selecione o mês";
  if (sorted.length === 1) return `${MONTH_SHORT_NAMES[sorted[0]]}/${period.year}`;
  return `${sorted.map((m) => MONTH_SHORT_NAMES[m]).join(", ")} · ${period.year}`;
}

export function PeriodFilter({
  value,
  onChange,
}: {
  value: PeriodFilterValue;
  onChange: (v: PeriodFilterValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggleMonth(m: number) {
    if (value.mode !== "months") {
      onChange({ mode: "months", year: value.year, months: [m] });
      return;
    }
    const has = value.months.includes(m);
    const next = has ? value.months.filter((x) => x !== m) : [...value.months, m];
    if (next.length === 0) return; // sempre mantém pelo menos 1 mês selecionado
    onChange({ mode: "months", year: value.year, months: next });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-card border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-elevated"
      >
        <Calendar className="h-4 w-4 text-primary" />
        {periodLabel(value)}
        <ChevronDown className={cn("h-4 w-4 text-text-tertiary transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-card border border-border bg-surface-elevated p-3 shadow-card">
          <div className="mb-3 flex gap-1.5 rounded-control bg-background-secondary p-1">
            <button
              onClick={() => onChange({ mode: "year", year: value.year })}
              className={cn(
                "flex-1 rounded-control px-3 py-1.5 text-sm font-medium transition-colors",
                value.mode === "year" ? "bg-primary text-white" : "text-text-secondary hover:text-text"
              )}
            >
              Ano atual
            </button>
            <button
              onClick={() =>
                onChange(
                  value.mode === "months"
                    ? value
                    : { mode: "months", year: value.year, months: [new Date().getMonth()] }
                )
              }
              className={cn(
                "flex-1 rounded-control px-3 py-1.5 text-sm font-medium transition-colors",
                value.mode === "months" ? "bg-primary text-white" : "text-text-secondary hover:text-text"
              )}
            >
              Mensal
            </button>
          </div>

          {value.mode === "year" ? (
            <p className="px-1 py-2 text-xs text-text-tertiary">Considera todos os meses de {value.year}.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_SHORT_NAMES.map((name, i) => {
                const active = value.months.includes(i);
                return (
                  <button
                    key={name}
                    onClick={() => toggleMonth(i)}
                    className={cn(
                      "rounded-control px-2 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-white"
                        : "bg-background-secondary text-text-secondary hover:text-text"
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
