"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MonthSelector } from "@/components/MonthSelector";
import { CategoryRow } from "@/components/CategoryRow";
import { IncomeCategoryRow } from "@/components/IncomeCategoryRow";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import {
  useMonthData,
  ensureExpenseRow,
  setExpensePayment,
  setIncomeAmount,
  setCategoryNote,
} from "@/lib/hooks/useMonthData";
import type { Category, MonthlyExpense, MonthlyIncome, PaymentMethod } from "@/lib/types";
import { addMonths, formatCurrency } from "@/lib/utils";

/** Separa categorias em Fixas/Variáveis — Fixas sempre aparecem primeiro. */
function splitByNature(categories: Category[]) {
  return {
    fixed: categories.filter((c) => c.nature === "fixed"),
    variable: categories.filter((c) => c.nature === "variable"),
  };
}

export default function MeuMesPage() {
  const [date, setDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { householdId, members, categories, loading: loadingHousehold } = useHouseholdData();
  const { expenses, incomes, notes, reload, monthKey } = useMonthData(householdId, date);
  const [tab, setTab] = useState<"expense" | "income">("expense");

  // Observações digitadas ficam no estado local imediatamente (resposta
  // instantânea) e são salvas com um pequeno atraso após parar de digitar.
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setLocalNotes({});
  }, [monthKey]);

  const notesByCategory = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of notes) map[n.category_id] = n.notes ?? "";
    return map;
  }, [notes]);

  function handleNotesChange(categoryId: string, value: string) {
    setLocalNotes((prev) => ({ ...prev, [categoryId]: value }));
    if (!householdId) return;
    clearTimeout(noteTimers.current[categoryId]);
    noteTimers.current[categoryId] = setTimeout(() => {
      setCategoryNote({ householdId, monthKey, categoryId, notes: value });
    }, 700);
  }

  const expenseCategories = categories.filter((c) => c.kind === "expense" && c.active);
  const incomeCategories = categories.filter((c) => c.kind === "income" && c.active);
  const { fixed: fixedExpense, variable: variableExpense } = splitByNature(expenseCategories);
  const { fixed: fixedIncome, variable: variableIncome } = splitByNature(incomeCategories);

  const totalExpenses = expenses.reduce((s, e) => s + e.total, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

  const expensesByCategory = useMemo(() => {
    const map: Record<string, Record<string, MonthlyExpense | undefined>> = {};
    for (const cat of expenseCategories) {
      map[cat.id] = {};
      for (const member of members) {
        map[cat.id][member.id] = expenses.find(
          (e) => e.category_id === cat.id && e.member_id === member.id
        );
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, categories, members]);

  const incomesByCategory = useMemo(() => {
    const map: Record<string, Record<string, MonthlyIncome | undefined>> = {};
    for (const cat of incomeCategories) {
      map[cat.id] = {};
      for (const member of members) {
        map[cat.id][member.id] = incomes.find(
          (i) => i.category_id === cat.id && i.member_id === member.id
        );
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomes, categories, members]);

  async function handlePaymentChange(
    categoryId: string,
    memberId: string,
    method: PaymentMethod,
    amount: number
  ) {
    if (!householdId) return;
    const existing = expenses.find((e) => e.category_id === categoryId && e.member_id === memberId);
    const expenseId = await ensureExpenseRow({
      householdId,
      monthKey,
      categoryId,
      memberId,
      existingId: existing?.id,
    });
    await setExpensePayment({ expenseId, method, amount });
    await reload();
  }

  async function handleIncomeChange(categoryId: string, memberId: string, amount: number) {
    if (!householdId) return;
    await setIncomeAmount({ householdId, monthKey, categoryId, memberId, amount });
    await reload();
  }

  if (loadingHousehold) {
    return <p className="text-sm text-text-secondary">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <MonthSelector date={date} onPrev={() => setDate(addMonths(date, -1))} onNext={() => setDate(addMonths(date, 1))} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Receitas</span>
          <span className="font-semibold text-success tabular-nums">{formatCurrency(totalIncome)}</span>
        </Card>
        <Card className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Despesas</span>
          <span className="font-semibold text-danger tabular-nums">{formatCurrency(totalExpenses)}</span>
        </Card>
        <Card className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Saldo</span>
          <span className="font-semibold tabular-nums">{formatCurrency(totalIncome - totalExpenses)}</span>
        </Card>
      </div>

      <div className="flex overflow-hidden rounded-control border border-border self-start">
        <button
          onClick={() => setTab("expense")}
          className={`px-4 py-2 text-sm font-medium ${tab === "expense" ? "bg-primary text-white" : "bg-surface text-text-secondary"}`}
        >
          Despesas
        </button>
        <button
          onClick={() => setTab("income")}
          className={`px-4 py-2 text-sm font-medium ${tab === "income" ? "bg-primary text-white" : "bg-surface text-text-secondary"}`}
        >
          Receitas
        </button>
      </div>

      {tab === "expense" ? (
        expenseCategories.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria de despesa"
            description="Crie categorias em Categorias para começar a lançar seus gastos do mês."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {fixedExpense.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Fixas</p>
            )}
            {fixedExpense.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                members={members}
                expensesByMember={expensesByCategory[cat.id]}
                notes={localNotes[cat.id] ?? notesByCategory[cat.id]}
                onNotesChange={(value) => handleNotesChange(cat.id, value)}
                onChangePayment={(memberId, method, amount) =>
                  handlePaymentChange(cat.id, memberId, method, amount)
                }
              />
            ))}

            {fixedExpense.length > 0 && variableExpense.length > 0 && <div className="h-2" />}

            {variableExpense.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Variáveis</p>
            )}
            {variableExpense.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                members={members}
                expensesByMember={expensesByCategory[cat.id]}
                notes={localNotes[cat.id] ?? notesByCategory[cat.id]}
                onNotesChange={(value) => handleNotesChange(cat.id, value)}
                onChangePayment={(memberId, method, amount) =>
                  handlePaymentChange(cat.id, memberId, method, amount)
                }
              />
            ))}
          </div>
        )
      ) : incomeCategories.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria de receita"
          description="Crie categorias de receita (ex: Salário) em Categorias."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {fixedIncome.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Fixas</p>
          )}
          {fixedIncome.map((cat) => (
            <IncomeCategoryRow
              key={cat.id}
              category={cat}
              members={members}
              incomesByMember={incomesByCategory[cat.id]}
              notes={localNotes[cat.id] ?? notesByCategory[cat.id]}
              onNotesChange={(value) => handleNotesChange(cat.id, value)}
              onChangeIncome={(memberId, amount) => handleIncomeChange(cat.id, memberId, amount)}
            />
          ))}

          {fixedIncome.length > 0 && variableIncome.length > 0 && <div className="h-2" />}

          {variableIncome.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Variáveis</p>
          )}
          {variableIncome.map((cat) => (
            <IncomeCategoryRow
              key={cat.id}
              category={cat}
              members={members}
              incomesByMember={incomesByCategory[cat.id]}
              notes={localNotes[cat.id] ?? notesByCategory[cat.id]}
              onNotesChange={(value) => handleNotesChange(cat.id, value)}
              onChangeIncome={(memberId, amount) => handleIncomeChange(cat.id, memberId, amount)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
