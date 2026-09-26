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
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.09]"
      >
        <Calendar className="h-4 w-4 text-[#B7A3F5]" />
        {periodLabel(value)}
        <ChevronDown className={cn("h-4 w-4 text-white/50 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-[#160F2C] p-3 shadow-2xl shadow-black/50">
          <div className="mb-3 flex gap-1.5 rounded-xl bg-white/[0.05] p-1">
            <button
              onClick={() => onChange({ mode: "year", year: value.year })}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                value.mode === "year" ? "bg-gradient-to-br from-[#8D6CE6] to-[#5B3FD4] text-white" : "text-white/55 hover:text-white/85"
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
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                value.mode === "months" ? "bg-gradient-to-br from-[#8D6CE6] to-[#5B3FD4] text-white" : "text-white/55 hover:text-white/85"
              )}
            >
              Mensal
            </button>
          </div>

          {value.mode === "year" ? (
            <p className="px-1 py-2 text-xs text-white/50">Considera todos os meses de {value.year}.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_SHORT_NAMES.map((name, i) => {
                const active = value.months.includes(i);
                return (
                  <button
                    key={name}
                    onClick={() => toggleMonth(i)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-gradient-to-br from-[#8D6CE6] to-[#5B3FD4] text-white"
                        : "bg-white/[0.05] text-white/60 hover:text-white/85"
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
