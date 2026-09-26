"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Wallet2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { FinancialCard } from "@/components/FinancialCard";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { useMonthData } from "@/lib/hooks/useMonthData";
import { useMonthsSummary } from "@/lib/hooks/useMonthsSummary";
import { useTheme } from "@/lib/theme";
import { CHART_COLORS, tooltipStyle } from "@/lib/chartColors";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact, monthLabel, monthLabelShort } from "@/lib/utils";

const MAX_SLICES = 5;

/** Agrupa em "top N + Outros" para o gráfico de rosca nunca quebrar, não importa quantas categorias existam. */
function topNWithOthers(entries: { name: string; value: number }[], max = MAX_SLICES) {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  if (sorted.length <= max) return sorted;
  const top = sorted.slice(0, max);
  const othersTotal = sorted.slice(max).reduce((s, e) => s + e.value, 0);
  if (othersTotal > 0) top.push({ name: "Outros", value: othersTotal });
  return top;
}

function DonutCard({ title, data, colors, othersColor }: { title: string; data: { name: string; value: number }[]; colors: string[]; othersColor: string }) {
  const grouped = useMemo(() => topNWithOthers(data), [data]);
  const total = grouped.reduce((s, e) => s + e.value, 0);
  const { theme } = useTheme();
  const c = CHART_COLORS[theme];

  function colorFor(name: string, index: number) {
    if (name === "Outros") return othersColor;
    return colors[index % colors.length];
  }

  return (
    <Card>
      <h3 className="mb-1 font-medium">{title}</h3>
      {grouped.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-secondary">Nenhum gasto lançado neste mês.</p>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={grouped}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={92}
                  paddingAngle={grouped.length > 1 ? 3 : 0}
                  cornerRadius={8}
                  stroke="none"
                >
                  {grouped.map((entry, i) => (
                    <Cell key={entry.name} fill={colorFor(entry.name, i)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle(c)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-text-secondary">Total</span>
              <span className="text-lg font-semibold tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Legenda em flex-wrap: comporta qualquer quantidade de categorias sem quebrar o layout */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {grouped.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colorFor(entry.name, i) }} />
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [date] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { householdId, categories, members, loading: loadingHousehold } = useHouseholdData();
  const { expenses, incomes } = useMonthData(householdId, date);
  const { summaries } = useMonthsSummary(householdId, date, 6);
  const { theme } = useTheme();
  const c = CHART_COLORS[theme];

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.total, 0);
  const totalCredit = expenses.reduce(
    (s, e) => s + e.payments.filter((p) => p.method === "credit").reduce((s2, p) => s2 + p.amount, 0),
    0
  );
  const balance = totalIncome - totalExpenses;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      const cat = categories.find((cat) => cat.id === e.category_id);
      if (!cat) continue;
      map[cat.name] = (map[cat.name] ?? 0) + e.total;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses, categories]);

  const byMethod = useMemo(() => {
    const map: Record<PaymentMethod, number> = { pix: 0, credit: 0, debit: 0, cash: 0, boleto: 0, other: 0 };
    for (const e of expenses) for (const p of e.payments) map[p.method] += p.amount;
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([method, value]) => ({ name: PAYMENT_METHOD_LABELS[method as PaymentMethod], value }));
  }, [expenses]);

  const byPerson = useMemo(() => {
    return members.map((m) => ({
      member: m,
      income: incomes.filter((i) => i.member_id === m.id).reduce((s, i) => s + i.amount, 0),
      expenses: expenses.filter((e) => e.member_id === m.id).reduce((s, e) => s + e.total, 0),
    }));
  }, [members, incomes, expenses]);

  const chartData = summaries.map((s) => ({ ...s, label: monthLabelShort(s.date) }));

  // Paleta dos gráficos de rosca: azul de interação + verde/âmbar de apoio,
  // seguindo "evitar múltiplas cores sem necessidade" do Design System.
  const donutColors = [c.primary, c.success, c.warning, c.danger, c.primaryLine];
  const othersColor = c.axisText;

  if (loadingHousehold) return <p className="text-sm text-text-secondary">Carregando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold capitalize">{monthLabel(date)}</h1>
        <p className="text-sm text-text-secondary">Visão geral das finanças da família</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <FinancialCard label="Receitas" value={totalIncome} icon={ArrowUpCircle} tone="success" />
        <FinancialCard label="Despesas" value={totalExpenses} icon={ArrowDownCircle} tone="danger" />
        <FinancialCard label="Saldo" value={balance} icon={Wallet2} tone="primary" />
        <FinancialCard label="Cartão" value={totalCredit} icon={CreditCard} tone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1) Quem gastou — primeiro card, da esquerda para direita */}
        <Card>
          <h3 className="mb-3 font-medium">Quem gastou?</h3>
          <div className="flex flex-col">
            {byPerson.map(({ member, income, expenses: exp }) => (
              <div key={member.id} className="flex items-center justify-between border-b border-border py-3 last:border-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${member.color}26`, color: member.color }}
                  >
                    {member.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate font-medium">{member.display_name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-right text-sm">
                  <div>
                    <p className="text-[11px] text-text-secondary">Receitas</p>
                    <p className="tabular-nums font-medium text-success">{formatCurrency(income)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-secondary">Despesas</p>
                    <p className="tabular-nums font-medium text-danger">{formatCurrency(exp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 2) Receitas x Despesas */}
        <Card>
          <h3 className="mb-4 font-medium">Receitas x Despesas</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: c.axisText }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tick={{ fill: c.axisText }}
                tickFormatter={(v) => formatCurrencyCompact(v)}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle(c)} cursor={{ fill: "rgba(128,128,128,0.08)" }} />
              <Legend wrapperStyle={{ color: c.axisText, fontSize: 12 }} />
              <Bar dataKey="income" name="Receitas" fill={c.success} radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill={c.danger} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 3) e 4) Gráficos de rosca — agrupam em "top 5 + Outros" para nunca quebrar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DonutCard title="Gastos por categoria" data={byCategory} colors={donutColors} othersColor={othersColor} />
        <DonutCard title="Gastos por forma de pagamento" data={byMethod} colors={donutColors} othersColor={othersColor} />
      </div>
    </div>
  );
}
