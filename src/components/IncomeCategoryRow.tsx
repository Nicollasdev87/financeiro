"use client";

import { useMemo } from "react";
import { CategoryShell } from "@/components/CategoryShell";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { Category, Member, MonthlyIncome } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function IncomeCategoryRow({
  category,
  members,
  incomesByMember,
  onChangeIncome,
  notes,
  onNotesChange,
  defaultOpen = false,
}: {
  category: Category;
  members: Member[];
  incomesByMember: Record<string, MonthlyIncome | undefined>;
  onChangeIncome: (memberId: string, amount: number) => void;
  notes?: string;
  onNotesChange?: (value: string) => void;
  defaultOpen?: boolean;
}) {
  const total = useMemo(
    () => Object.values(incomesByMember).reduce((sum, i) => sum + (i?.amount ?? 0), 0),
    [incomesByMember]
  );

  return (
    <CategoryShell
      color={category.color}
      name={category.name}
      natureLabel={category.nature === "fixed" ? "Fixo" : "Variável"}
      totalDisplay={<span className="tabular-nums font-semibold text-success">{formatCurrency(total)}</span>}
      description={category.description}
      notes={notes}
      onNotesChange={onNotesChange}
      defaultOpen={defaultOpen}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {members.map((member) => {
          const income = incomesByMember[member.id];
          return (
            <div key={member.id} className="rounded-control border border-border p-2">
              <p className="mb-1 flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: member.color }} />
                {member.display_name}
              </p>
              <CurrencyInput
                value={income?.amount ?? 0}
                onCommit={(value) => onChangeIncome(member.id, value)}
              />
            </div>
          );
        })}
      </div>
    </CategoryShell>
  );
}
