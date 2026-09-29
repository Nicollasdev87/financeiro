"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Plus, PiggyBank } from "lucide-react";
import { MonthSelector } from "@/components/MonthSelector";
import { PageHeader } from "@/components/PageHeader";
import { InvestmentCategoryRow } from "@/components/InvestmentCategoryRow";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { useMonthData, setInvestmentAmount, setCategoryNote } from "@/lib/hooks/useMonthData";
import { useMonthsSummary } from "@/lib/hooks/useMonthsSummary";
import { createClient } from "@/lib/supabase/client";
import type { MonthlyInvestment } from "@/lib/types";
import { addMonths, formatCurrency, formatCurrencyCompact, monthLabelShort } from "@/lib/utils";
import { CATEGORY_COLORS as COLORS } from "@/lib/categoryColors";

export default function InvestimentosPage() {
  const [date, setDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { householdId, members, categories, reload: reloadHousehold, loading: loadingHousehold } = useHouseholdData();
  const { investments, notes, reload: reloadMonth, monthKey } = useMonthData(householdId, date);
  const { summaries } = useMonthsSummary(householdId, date, 6);
  const supabase = createClient();

  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", color: COLORS[0], description: "" });

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

  const investmentCategories = categories.filter((c) => c.kind === "investment" && c.active);

  const investmentsByCategory = useMemo(() => {
    const map: Record<string, Record<string, MonthlyInvestment | undefined>> = {};
    for (const cat of investmentCategories) {
      map[cat.id] = {};
      for (const member of members) {
        map[cat.id][member.id] = investments.find(
          (i) => i.category_id === cat.id && i.member_id === member.id
        );
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investments, categories, members]);

  const totalThisMonth = investments.reduce((s, i) => s + i.amount, 0);
  const accumulated = summaries[summaries.length - 1]?.investmentAccumulated ?? 0;

  async function handleChange(categoryId: string, memberId: string, amount: number) {
    if (!householdId) return;
    await setInvestmentAmount({ householdId, monthKey, categoryId, memberId, amount });
    await reloadMonth();
  }

  function openNewCategory() {
    setCatForm({ name: "", color: COLORS[0], description: "" });
    setCatOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId) return;

    const { error } = await supabase.from("categories").insert({
      household_id: householdId,
      name: catForm.name,
      kind: "investment",
      nature: "variable",
      color: catForm.color,
      description: catForm.description || null,
      icon: "circle",
      sort_order: categories.length,
    });

    if (error) {
      alert(`Não foi possível salvar a categoria: ${error.message}`);
      return;
    }

    setCatOpen(false);
    reloadHousehold();
  }

  if (loadingHousehold) return <p className="text-sm text-text-secondary">Carregando...</p>;

  const chartData = summaries.map((s) => ({
    label: monthLabelShort(s.date),
    Aportes: s.investment,
    Acumulado: s.investmentAccumulated,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Investimentos" subtitle="Acompanhe seus aportes mês a mês">
        <MonthSelector date={date} onPrev={() => setDate(addMonths(date, -1))} onNext={() => setDate(addMonths(date, 1))} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Investido no mês</span>
          <span className="font-semibold text-success tabular-nums">{formatCurrency(totalThisMonth)}</span>
        </Card>
        <Card className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Total acumulado</span>
          <span className="font-semibold text-success tabular-nums">{formatCurrency(accumulated)}</span>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Categorias de investimento</h3>
        <Button size="sm" onClick={openNewCategory}>
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      </div>

      {investmentCategories.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="h-8 w-8" />}
          title="Nenhuma categoria de investimento"
          description="Cadastre categorias como Ações, Fundos Imobiliários ou Renda Fixa para começar a lançar seus aportes."
          action={<Button onClick={openNewCategory}>Cadastrar categoria</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {investmentCategories.map((cat) => (
            <InvestmentCategoryRow
              key={cat.id}
              category={cat}
              members={members}
              investmentsByMember={investmentsByCategory[cat.id]}
              notes={localNotes[cat.id] ?? notesByCategory[cat.id]}
              onNotesChange={(value) => handleNotesChange(cat.id, value)}
              onChangeInvestment={(memberId, amount) => handleChange(cat.id, memberId, amount)}
            />
          ))}
        </div>
      )}

      <Card>
        <h3 className="mb-4 font-medium">Evolução dos investimentos</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "var(--text-tertiary)" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tick={{ fill: "var(--text-tertiary)" }}
              tickFormatter={(v) => formatCurrencyCompact(v)}
            />
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: 10,
                color: "var(--text-primary)",
              }}
            />
            <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: 12 }} />
            <Line type="monotone" dataKey="Aportes" stroke="rgb(var(--success-rgb) / 1)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Acumulado" stroke="#7C5CFC" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="py-2 font-medium">Mês</th>
              <th className="py-2 text-right font-medium">Aportes</th>
              <th className="py-2 text-right font-medium">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.month} className="border-b border-border last:border-0">
                <td className="py-2 capitalize">{monthLabelShort(s.date)}</td>
                <td className="py-2 text-right tabular-nums text-success">{formatCurrency(s.investment)}</td>
                <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(s.investmentAccumulated)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={catOpen} onClose={() => setCatOpen(false)} title="Nova categoria de investimento">
        <form onSubmit={handleSaveCategory} className="flex flex-col gap-3">
          <Input
            placeholder="Nome (ex: Ações, Fundos Imobiliários)"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
          />
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCatForm({ ...catForm, color: c })}
                className="h-7 w-7 rounded-full ring-offset-2"
                style={{ backgroundColor: c, boxShadow: catForm.color === c ? `0 0 0 2px ${c}` : undefined }}
              />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">
              Descrição (aparece ao expandir a categoria)
            </label>
            <textarea
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              placeholder="Ex: carteira de ações na corretora X..."
              rows={2}
              className="w-full resize-none rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <Button type="submit" className="mt-1">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
