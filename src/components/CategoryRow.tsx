"use client";

import { useMemo } from "react";
import { CategoryShell } from "@/components/CategoryShell";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { Category, Member, MonthlyExpense, PaymentMethod } from "@/lib/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const METHODS: PaymentMethod[] = ["pix", "credit", "debit", "cash"];

export function CategoryRow({
  category,
  members,
  expensesByMember,
  onChangePayment,
  notes,
  onNotesChange,
  defaultOpen = false,
}: {
  category: Category;
  members: Member[];
  expensesByMember: Record<string, MonthlyExpense | undefined>;
  onChangePayment: (memberId: string, method: PaymentMethod, amount: number) => void;
  notes?: string;
  onNotesChange?: (value: string) => void;
  defaultOpen?: boolean;
}) {
  const total = useMemo(
    () => Object.values(expensesByMember).reduce((sum, e) => sum + (e?.total ?? 0), 0),
    [expensesByMember]
  );

  return (
    <CategoryShell
      color={category.color}
      name={category.name}
      natureLabel={category.nature === "fixed" ? "Fixo" : "Variável"}
      totalDisplay={<span className="tabular-nums font-semibold">{formatCurrency(total)}</span>}
      description={category.description}
      notes={notes}
      onNotesChange={onNotesChange}
      defaultOpen={defaultOpen}
    >
      {members.map((member) => {
        const expense = expensesByMember[member.id];
        return (
          <div key={member.id}>
            {members.length > 1 && (
              <div className="mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: member.color }} />
                <span className="text-xs font-medium text-text-secondary">{member.display_name}</span>
              </div>
            )}
            <div className="grid grid-cols-2 divide-x divide-border/70 rounded-control bg-background sm:grid-cols-4">
              {METHODS.map((method) => {
                const payment = expense?.payments.find((p) => p.method === method);
                return (
                  <div key={method} className="px-2.5 py-2 first:rounded-l-control last:rounded-r-control">
                    <p className="mb-0.5 text-[11px] uppercase tracking-wide text-text-secondary">
                      {PAYMENT_METHOD_LABELS[method]}
                    </p>
                    <CurrencyInput
                      value={payment?.amount ?? 0}
                      onCommit={(value) => onChangePayment(member.id, method, value)}
                      align="left"
                      className="px-0 hover:bg-transparent"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </CategoryShell>
  );
}
