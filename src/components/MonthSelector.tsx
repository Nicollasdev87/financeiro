"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "@/lib/utils";

export function MonthSelector({
  date,
  onPrev,
  onNext,
}: {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        aria-label="Mês anterior"
        className="flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface hover:bg-black/5"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <h2 className="min-w-[180px] text-center text-lg font-semibold capitalize">
        {monthLabel(date)}
      </h2>
      <button
        onClick={onNext}
        aria-label="Próximo mês"
        className="flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface hover:bg-black/5"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
