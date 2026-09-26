"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MonthlyExpense, MonthlyIncome } from "@/lib/types";
import { fromMonthKey } from "@/lib/utils";

/**
 * Despesas/receitas combinadas de uma lista arbitrária de meses (não precisa
 * ser um intervalo contínuo). Usado pelos cards e gráficos "agregados" do
 * dashboard (quem gastou, por categoria, por forma de pagamento).
 */
export function useSelectedMonthsData(householdId: string | null, monthKeys: string[]) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [incomes, setIncomes] = useState<MonthlyIncome[]>([]);
  const key = monthKeys.join(",");

  const reload = useCallback(async () => {
    if (!householdId || monthKeys.length === 0) {
      setExpenses([]);
      setIncomes([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: expenseRows }, { data: incomeRows }] = await Promise.all([
      supabase
        .from("monthly_expenses")
        .select("*, payments:monthly_expense_payments(*)")
        .eq("household_id", householdId)
        .in("month", monthKeys),
      supabase.from("monthly_income").select("*").eq("household_id", householdId).in("month", monthKeys),
    ]);

    setExpenses((expenseRows as MonthlyExpense[]) ?? []);
    setIncomes(incomeRows ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, householdId, key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, expenses, incomes, reload };
}

export interface MonthSummary {
  month: string;
  date: Date;
  income: number;
  expenses: number;
  credit: number;
}

/**
 * Um resumo (receita/despesa/cartão) por mês, na mesma ordem de `monthKeys`
 * — alimenta o gráfico "Receitas x Despesas" com exatamente os meses que o
 * filtro do dashboard tem selecionados.
 */
export function useSelectedMonthsSummaries(householdId: string | null, monthKeys: string[]) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<MonthSummary[]>([]);
  const key = monthKeys.join(",");

  const reload = useCallback(async () => {
    if (!householdId || monthKeys.length === 0) {
      setSummaries([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: expenseRows }, { data: incomeRows }] = await Promise.all([
      supabase
        .from("monthly_expenses")
        .select("month, total, payments:monthly_expense_payments(method, amount)")
        .eq("household_id", householdId)
        .in("month", monthKeys),
      supabase.from("monthly_income").select("month, amount").eq("household_id", householdId).in("month", monthKeys),
    ]);

    const result = monthKeys.map((mKey) => {
      const expensesForMonth = (expenseRows ?? []).filter((e: any) => e.month === mKey);
      const incomeForMonth = (incomeRows ?? []).filter((i: any) => i.month === mKey);

      const expenses = expensesForMonth.reduce((s: number, e: any) => s + Number(e.total), 0);
      const income = incomeForMonth.reduce((s: number, i: any) => s + Number(i.amount), 0);
      const credit = expensesForMonth.reduce(
        (s: number, e: any) =>
          s +
          (e.payments ?? [])
            .filter((p: any) => p.method === "credit")
            .reduce((s2: number, p: any) => s2 + Number(p.amount), 0),
        0
      );

      return { month: mKey, date: fromMonthKey(mKey), income, expenses, credit };
    });

    setSummaries(result);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, householdId, key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, summaries, reload };
}
