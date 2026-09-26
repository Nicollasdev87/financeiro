"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CategoryNote, MonthlyExpense, MonthlyIncome, PaymentMethod } from "@/lib/types";
import { toMonthKey } from "@/lib/utils";

export function useMonthData(householdId: string | null, date: Date) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [incomes, setIncomes] = useState<MonthlyIncome[]>([]);
  const [notes, setNotes] = useState<CategoryNote[]>([]);
  const monthKey = toMonthKey(date);

  const reload = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);

    const [{ data: expenseRows }, { data: incomeRows }, { data: noteRows }] = await Promise.all([
      supabase
        .from("monthly_expenses")
        .select("*, payments:monthly_expense_payments(*)")
        .eq("household_id", householdId)
        .eq("month", monthKey),
      supabase
        .from("monthly_income")
        .select("*")
        .eq("household_id", householdId)
        .eq("month", monthKey),
      supabase
        .from("monthly_category_notes")
        .select("*")
        .eq("household_id", householdId)
        .eq("month", monthKey),
    ]);

    setExpenses((expenseRows as MonthlyExpense[]) ?? []);
    setIncomes(incomeRows ?? []);
    setNotes(noteRows ?? []);
    setLoading(false);
  }, [supabase, householdId, monthKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, expenses, incomes, notes, reload, monthKey };
}

/** Cria (se preciso) a linha monthly_expenses para household+mes+categoria+membro e retorna o id. */
export async function ensureExpenseRow(params: {
  householdId: string;
  monthKey: string;
  categoryId: string;
  memberId: string | null;
  existingId?: string;
}) {
  const supabase = createClient();
  if (params.existingId) return params.existingId;

  const { data, error } = await supabase
    .from("monthly_expenses")
    .upsert(
      {
        household_id: params.householdId,
        month: params.monthKey,
        category_id: params.categoryId,
        member_id: params.memberId,
        total: 0,
      },
      { onConflict: "household_id,month,category_id,member_id" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

/**
 * Atualiza (upsert) um valor de forma de pagamento e recalcula o total da linha.
 *
 * IMPORTANTE: não usamos `.upsert(...).onConflict(...)` aqui de propósito.
 * A constraint única é (monthly_expense_id, method, credit_card_id), mas
 * credit_card_id é NULL para pix/débito/dinheiro/etc — e no Postgres,
 * dentro de uma unique constraint padrão, cada NULL é tratado como
 * diferente de qualquer outro NULL. Ou seja, o ON CONFLICT nunca "batia"
 * com a linha existente quando não havia cartão, e cada edição criava uma
 * linha NOVA em vez de atualizar a antiga — daí o valor "somar" sozinho
 * (ex: editar de 400 para 450 resultava em 850, mostrando 400 no campo
 * porque a tela pegava a primeira das duas linhas duplicadas).
 * Por isso buscamos a linha manualmente antes de decidir entre update/insert.
 */
export async function setExpensePayment(params: {
  expenseId: string;
  method: PaymentMethod;
  creditCardId?: string | null;
  amount: number;
}) {
  const supabase = createClient();
  const creditCardId = params.creditCardId ?? null;

  let existingQuery = supabase
    .from("monthly_expense_payments")
    .select("id")
    .eq("monthly_expense_id", params.expenseId)
    .eq("method", params.method);

  existingQuery = creditCardId
    ? existingQuery.eq("credit_card_id", creditCardId)
    : existingQuery.is("credit_card_id", null);

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    await supabase
      .from("monthly_expense_payments")
      .update({ amount: params.amount })
      .eq("id", existing.id);
  } else {
    await supabase.from("monthly_expense_payments").insert({
      monthly_expense_id: params.expenseId,
      method: params.method,
      credit_card_id: creditCardId,
      amount: params.amount,
    });
  }

  const { data: payments } = await supabase
    .from("monthly_expense_payments")
    .select("amount")
    .eq("monthly_expense_id", params.expenseId);

  const total = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  await supabase.from("monthly_expenses").update({ total }).eq("id", params.expenseId);

  return total;
}

/** Cria/edita a observação (texto livre) de uma categoria em um mês específico. */
export async function setCategoryNote(params: {
  householdId: string;
  monthKey: string;
  categoryId: string;
  notes: string;
}) {
  const supabase = createClient();
  await supabase.from("monthly_category_notes").upsert(
    {
      household_id: params.householdId,
      month: params.monthKey,
      category_id: params.categoryId,
      notes: params.notes,
    },
    { onConflict: "household_id,month,category_id" }
  );
}

export async function setIncomeAmount(params: {
  householdId: string;
  monthKey: string;
  categoryId: string;
  memberId: string | null;
  amount: number;
}) {
  const supabase = createClient();
  await supabase.from("monthly_income").upsert(
    {
      household_id: params.householdId,
      month: params.monthKey,
      category_id: params.categoryId,
      member_id: params.memberId,
      amount: params.amount,
    },
    { onConflict: "household_id,month,category_id,member_id" }
  );
}
