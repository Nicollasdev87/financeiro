"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, PiggyBank, Wallet2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { StatChip } from "@/components/dashboard/StatChip";
import { InvitationsBanner } from "@/components/InvitationsBanner";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { StackedBar } from "@/components/dashboard/StackedBar";
import { PeriodFilter, PeriodFilterValue, monthKeysFromPeriod } from "@/components/dashboard/PeriodFilter";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { useSelectedMonthsData, useSelectedMonthsSummaries } from "@/lib/hooks/useSelectedMonths";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact, monthLabelShort } from "@/lib/utils";

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodFilterValue>(() => ({
    mode: "year",
    year: new Date().getFullYear(),
  }));
  const monthKeys = useMemo(() => monthKeysFromPeriod(period), [period]);

  const { householdId, categories, members, loading: loadingHousehold } = useHouseholdData();
  const { expenses, incomes } = useSelectedMonthsData(householdId, monthKeys);
  const { summaries } = useSelectedMonthsSummaries(householdId, monthKeys);

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.total, 0);
  const totalCredit = expenses.reduce(
    (s, e) => s + e.payments.filter((p) => p.method === "credit").reduce((s2, p) => s2 + p.amount, 0),
    0
  );
  const totalInvestment = summaries.reduce((s, m) => s + m.investment, 0);
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

  // Colunas divergentes: receitas somam para cima a partir do zero, despesas
  // (negativadas) somam para baixo — o mesmo stackId faz as duas "empilharem"
  // a partir do eixo zero em vez de uma sobre a outra. Uma barra por mês
  // selecionado no filtro (ou pelos 12 meses do ano, no modo "Ano atual").
  const divergingData = summaries.map((s) => ({
    label: monthLabelShort(s.date),
    income: s.income,
    expenses: -s.expenses,
  }));
  const maxAbs = Math.max(1, ...divergingData.flatMap((d) => [Math.abs(d.income), Math.abs(d.expenses)]));

  // Coluna verde de investimentos, mês a mês, para o card ao lado de "Quem gastou?".
  const investmentData = summaries.map((s) => ({
    label: monthLabelShort(s.date),
    value: s.investment,
  }));

  if (loadingHousehold) return <p className="text-sm text-text-secondary">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pl-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text">Dashboard</h1>
          <p className="text-sm text-text-secondary">Visão geral financeira.</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="flex flex-col gap-4">
        {/* 1. Resumo rápido */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          <StatChip label="Receitas" value={totalIncome} icon={ArrowUpCircle} tone="success" />
          <StatChip label="Despesas" value={totalExpenses} icon={ArrowDownCircle} tone="danger" />
          <StatChip label="Investimentos" value={totalInvestment} icon={PiggyBank} tone="success" />
          <StatChip label="Saldo" value={balance} icon={Wallet2} tone="primary" />
          <StatChip label="Cartão" value={totalCredit} icon={CreditCard} tone="neutral" />
        </div>

        {/* Convites recebidos para participar de um planejamento (largura total) */}
        <InvitationsBanner hasHousehold={!!householdId} />

        {/* 2. Gastos por forma de pagamento (esquerda) + Receitas x Despesas (direita) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <GlassCard className="lg:col-span-2">
            <h3 className="mb-4 font-medium text-text">Gastos por forma de pagamento</h3>
            {byMethod.length === 0 ? (
              <p className="text-sm text-text-secondary">Nenhum gasto lançado neste mês.</p>
            ) : (
              <DonutChart data={byMethod} maxSlices={6} />
            )}
          </GlassCard>

          <GlassCard className="lg:col-span-3">
            <h3 className="mb-4 font-medium text-text">Receitas x Despesas</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={divergingData} stackOffset="sign">
                <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "var(--text-tertiary)" }}
                />
                <YAxis
                  domain={[-maxAbs, maxAbs]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fill: "var(--text-tertiary)" }}
                  tickFormatter={(v) => formatCurrencyCompact(Math.abs(v))}
                />
                <ReferenceLine y={0} stroke="var(--border-default)" />
                <Tooltip
                  formatter={(v: number) => formatCurrency(Math.abs(v))}
                  cursor={{ fill: "rgb(var(--blue-active-rgb) / 0.12)" }}
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 10,
                    color: "var(--text-primary)",
                  }}
                />
                <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: 12 }} />
                <Bar
                  dataKey="income"
                  name="Receitas"
                  fill="rgb(var(--success-rgb) / 1)"
                  stackId="a"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Despesas"
                  fill="rgb(var(--danger-rgb) / 1)"
                  stackId="a"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* 3. Gastos por categoria — barra empilhada, 100% da largura */}
        <GlassCard>
          <h3 className="mb-4 font-medium text-text">Gastos por categoria</h3>
          <StackedBar data={byCategory} />
        </GlassCard>

        {/* 4. Quem gastou (esquerda, mais estreito) + Investimentos mês a mês (direita, mais espaço) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <GlassCard className="lg:col-span-2">
            <h3 className="mb-4 font-medium text-text">Quem gastou?</h3>
            <div className="flex flex-col gap-3">
              {byPerson.map(({ member, income, expenses: exp }) => (
                <div key={member.id} className="rounded-control border border-border bg-background-secondary p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: member.color ?? "#2878F8" }}
                    />
                    <span className="font-medium text-text">{member.display_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-tertiary">Receitas</span>
                    <span className="tabular-nums text-success">{formatCurrency(income)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-tertiary">Despesas</span>
                    <span className="tabular-nums text-danger">{formatCurrency(exp)}</span>
                  </div>
                </div>
              ))}
              {byPerson.length === 0 && (
                <p className="text-sm text-text-secondary">Nenhum integrante cadastrado ainda.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="lg:col-span-3">
            <h3 className="mb-4 font-medium text-text">Investimentos</h3>
            {investmentData.every((d) => d.value === 0) ? (
              <p className="text-sm text-text-secondary">Nenhum aporte lançado neste período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={investmentData}>
                  <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tick={{ fill: "var(--text-tertiary)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tick={{ fill: "var(--text-tertiary)" }}
                    tickFormatter={(v) => formatCurrencyCompact(v)}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    cursor={{ fill: "rgb(var(--success-rgb) / 0.08)" }}
                    contentStyle={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border-default)",
                      borderRadius: 10,
                      color: "var(--text-primary)",
                    }}
                  />
                  <Bar dataKey="value" name="Investimentos" fill="rgb(var(--success-rgb) / 1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
