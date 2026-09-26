"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { addMonths, toMonthKey } from "@/lib/utils";

export interface MonthSummary {
  month: string; // YYYY-MM-01
  date: Date;
  income: number;
  expenses: number;
  credit: number;
  fixed: number;
  variable: number;
}

/** Busca um resumo agregado dos últimos `count` meses (incluindo o mês de referência). */
export function useMonthsSummary(householdId: string | null, referenceDate: Date, count = 6) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<MonthSummary[]>([]);

  const reload = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);

    const months = Array.from({ length: count }, (_, i) => addMonths(referenceDate, i - (count - 1)));
    const monthKeys = months.map(toMonthKey);
    const firstKey = monthKeys[0];
    const lastKey = monthKeys[monthKeys.length - 1];

    const [{ data: expenseRows }, { data: incomeRows }] = await Promise.all([
      supabase
        .from("monthly_expenses")
        .select("month, total, category_id, categories(nature), payments:monthly_expense_payments(method, amount)")
        .eq("household_id", householdId)
        .gte("month", firstKey)
        .lte("month", lastKey),
      supabase
        .from("monthly_income")
        .select("month, amount")
        .eq("household_id", householdId)
        .gte("month", firstKey)
        .lte("month", lastKey),
    ]);

    const result: MonthSummary[] = months.map((date) => {
      const key = toMonthKey(date);
      const expensesForMonth = (expenseRows ?? []).filter((e: any) => e.month === key);
      const incomeForMonth = (incomeRows ?? []).filter((i: any) => i.month === key);

      const expenses = expensesForMonth.reduce((s: number, e: any) => s + Number(e.total), 0);
      const income = incomeForMonth.reduce((s: number, i: any) => s + Number(i.amount), 0);
      const credit = expensesForMonth.reduce(
        (s: number, e: any) =>
          s + (e.payments ?? []).filter((p: any) => p.method === "credit").reduce((s2: number, p: any) => s2 + Number(p.amount), 0),
        0
      );
      const fixed = expensesForMonth
        .filter((e: any) => e.categories?.nature === "fixed")
        .reduce((s: number, e: any) => s + Number(e.total), 0);
      const variable = expenses - fixed;

      return { month: key, date, income, expenses, credit, fixed, variable };
    });

    setSummaries(result);
    setLoading(false);
  }, [supabase, householdId, toMonthKey(referenceDate), count]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, summaries, reload };
}
