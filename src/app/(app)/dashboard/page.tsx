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
} from "recharts";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { StatChip } from "@/components/dashboard/StatChip";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { StackedBar } from "@/components/dashboard/StackedBar";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { useMonthData } from "@/lib/hooks/useMonthData";
import { useMonthsSummary } from "@/lib/hooks/useMonthsSummary";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact, monthLabel, monthLabelShort } from "@/lib/utils";

export default function DashboardPage() {
  const [date] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { householdId, categories, members, loading: loadingHousehold } = useHouseholdData();
  const { expenses, incomes } = useMonthData(householdId, date);
  const { summaries } = useMonthsSummary(householdId, date, 6);

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
      const cat = categories.find((c) => c.id === e.category_id);
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

  if (loadingHousehold) return <p className="text-sm text-text-secondary">Carregando...</p>;

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-[#140F27] via-[#170F2C] to-[#0F0B1D] p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-semibold capitalize text-white">{monthLabel(date)}</h1>
        <p className="text-sm text-white/50">Visão geral das finanças da família</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* 1. Resumo rápido — agora no topo */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatChip label="Receitas" value={totalIncome} icon={ArrowUpCircle} tone="teal" />
          <StatChip label="Despesas" value={totalExpenses} icon={ArrowDownCircle} tone="pink" />
          <StatChip label="Saldo" value={balance} icon={Wallet2} tone="purple" />
          <StatChip label="Cartão" value={totalCredit} icon={CreditCard} tone="neutral" />
        </div>

        {/* 2. Quem gastou (esquerda) + Receitas x Despesas (direita) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <GlassCard className="lg:col-span-2">
            <h3 className="mb-4 font-medium text-white">Quem gastou?</h3>
            <div className="flex flex-col gap-3">
              {byPerson.map(({ member, income, expenses: exp }) => (
                <div key={member.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: member.color ?? "#8D6CE6" }}
                    />
                    <span className="font-medium text-white">{member.display_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Receitas</span>
                    <span className="tabular-nums text-[#9FE0E4]">{formatCurrency(income)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Despesas</span>
                    <span className="tabular-nums text-[#E5A6E1]">{formatCurrency(exp)}</span>
                  </div>
                </div>
              ))}
              {byPerson.length === 0 && (
                <p className="text-sm text-white/50">Nenhum integrante cadastrado ainda.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="lg:col-span-3">
            <h3 className="mb-4 font-medium text-white">Receitas x Despesas</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={summaries.map((s) => ({ ...s, label: monthLabelShort(s.date) }))}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "rgba(255,255,255,0.5)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "rgba(255,255,255,0.5)" }}
                  tickFormatter={(v) => formatCurrencyCompact(v)}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    background: "#1C1533",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                <Bar dataKey="income" name="Receitas" fill="#7ECED4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Despesas" fill="#D780D6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* 3. Gastos por categoria — barra empilhada, 100% da largura */}
        <GlassCard>
          <h3 className="mb-4 font-medium text-white">Gastos por categoria</h3>
          <StackedBar data={byCategory} />
        </GlassCard>

        {/* 4. Gastos por forma de pagamento — segue como rosca */}
        <GlassCard>
          <h3 className="mb-4 font-medium text-white">Gastos por forma de pagamento</h3>
          {byMethod.length === 0 ? (
            <p className="text-sm text-white/50">Nenhum gasto lançado neste mês.</p>
          ) : (
            <DonutChart data={byMethod} maxSlices={6} />
          )}
        </GlassCard>
      </div>
    </div>
  );
}
