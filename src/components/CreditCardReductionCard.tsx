"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, toMonthKey } from "@/lib/utils";
import type { MonthSummary } from "@/lib/hooks/useMonthsSummary";

interface CategoryShare {
  name: string;
  color: string;
  amount: number;
}

/**
 * Card prático de "reduzir o cartão": só aparece quando há gasto no crédito
 * no mês de referência. Mostra a meta (se definida), o comparativo com o
 * mês anterior, as categorias que mais pesam no cartão e ações concretas
 * pra baixar isso — não é só um gráfico, é um empurrão pra ação.
 */
export function CreditCardReductionCard({
  householdId,
  date,
  summaries,
}: {
  householdId: string | null;
  date: Date;
  summaries: MonthSummary[];
}) {
  const supabase = createClient();
  const last = summaries[summaries.length - 1];
  const prev = summaries[summaries.length - 2];

  const [goal, setGoal] = useState<number | null>(null);
  const [goalInput, setGoalInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [categories, setCategories] = useState<CategoryShare[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (!householdId) return;
    supabase
      .from("households")
      .select("credit_card_goal")
      .eq("id", householdId)
      .single()
      .then(({ data }) => setGoal(data?.credit_card_goal ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId]);

  useEffect(() => {
    if (!householdId || !last) return;
    setLoadingCategories(true);
    supabase
      .from("monthly_expense_payments")
      .select("amount, monthly_expenses!inner(household_id, month, categories(name, color))")
      .eq("method", "credit")
      .eq("monthly_expenses.household_id", householdId)
      .eq("monthly_expenses.month", toMonthKey(date))
      .then(({ data }) => {
        const map = new Map<string, CategoryShare>();
        for (const row of (data as any[]) ?? []) {
          const cat = row.monthly_expenses?.categories;
          if (!cat) continue;
          const entry = map.get(cat.name) ?? { name: cat.name, color: cat.color, amount: 0 };
          entry.amount += Number(row.amount);
          map.set(cat.name, entry);
        }
        setCategories([...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 4));
        setLoadingCategories(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, last?.month]);

  async function handleSaveGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId) return;
    const parsed = Number(goalInput.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    setSavingGoal(true);
    const { error } = await supabase.from("households").update({ credit_card_goal: parsed }).eq("id", householdId);
    setSavingGoal(false);
    if (!error) {
      setGoal(parsed);
      setEditingGoal(false);
    }
  }

  // Sem gasto de cartão no mês → nada a reduzir, o card nem aparece.
  if (!last || last.credit <= 0) return null;

  const progress = goal ? Math.min(1, last.credit / goal) : null;
  const overGoal = goal !== null && last.credit > goal;
  const delta = prev && prev.credit > 0 ? (last.credit - prev.credit) / prev.credit : null;

  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-warning/10 text-warning">
          <CreditCard className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="font-medium">Reduzir o cartão</h3>
          <p className="text-xs text-text-secondary">Gasto no crédito neste mês: {formatCurrency(last.credit)}</p>
        </div>
      </div>

      {/* Meta do mês */}
      <div className="mt-4">
        {goal === null && !editingGoal && (
          <button
            type="button"
            onClick={() => {
              setGoalInput("");
              setEditingGoal(true);
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Definir uma meta mensal de cartão
          </button>
        )}

        {editingGoal && (
          <form onSubmit={handleSaveGoal} className="flex flex-wrap items-center gap-2">
            <Input
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Ex: 800,00"
              className="w-36"
              autoFocus
              inputMode="decimal"
            />
            <Button type="submit" size="sm" disabled={savingGoal}>{savingGoal ? "Salvando..." : "Salvar meta"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditingGoal(false)}>Cancelar</Button>
          </form>
        )}

        {goal !== null && !editingGoal && (
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                Meta do mês: <span className="font-medium text-text">{formatCurrency(goal)}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setGoalInput(String(goal).replace(".", ","));
                  setEditingGoal(true);
                }}
                className="text-xs text-primary hover:underline"
              >
                Editar
              </button>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary">
              <div
                className={`h-full rounded-full transition-all ${overGoal ? "bg-danger" : "bg-success"}`}
                style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
              />
            </div>
            {overGoal && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                <AlertTriangle className="h-3.5 w-3.5" />
                {formatCurrency(last.credit - goal)} acima da meta.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Comparativo com o mês anterior */}
      {delta !== null && (
        <p
          className={`mt-3 flex items-center gap-1.5 text-sm ${delta <= 0 ? "text-success" : "text-danger"}`}
        >
          <TrendingDown className={`h-4 w-4 ${delta > 0 ? "rotate-180" : ""}`} />
          {delta <= 0
            ? `${Math.abs(Math.round(delta * 100))}% a menos no cartão que no mês anterior.`
            : `${Math.round(delta * 100)}% a mais no cartão que no mês anterior.`}
        </p>
      )}

      {/* Onde o cartão mais pesa */}
      {!loadingCategories && categories.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Onde o cartão mais pesa
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {categories.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                <span className="tabular-nums text-text-secondary">{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações práticas */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">O que fazer</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-text">
          <li>
            • Troque {categories[0]?.name ?? "a categoria que mais pesa"} para PIX ou débito — é onde o cartão mais
            pesa esse mês.
          </li>
          <li>• Revise assinaturas e recorrências lançadas no cartão: cancele o que não usa.</li>
          <li>• Evite parcelar compras variáveis — elas se acumulam nos meses seguintes.</li>
          <li>• Defina a meta acima e acompanhe a barra todo mês até ela ficar verde.</li>
        </ul>
      </div>
    </Card>
  );
}
