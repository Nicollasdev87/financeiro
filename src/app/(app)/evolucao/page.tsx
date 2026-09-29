"use client";

import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Card } from "@/components/ui/Card";
import { MonthSelector } from "@/components/MonthSelector";
import { PageHeader } from "@/components/PageHeader";
import { CreditCardReductionCard } from "@/components/CreditCardReductionCard";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { useMonthsSummary } from "@/lib/hooks/useMonthsSummary";
import { addMonths, formatCurrency, formatCurrencyCompact, monthLabelShort } from "@/lib/utils";

export default function EvolucaoPage() {
  const [date, setDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { householdId, loading } = useHouseholdData();
  const { summaries } = useMonthsSummary(householdId, date, 6);

  if (loading) return <p className="text-sm text-text-secondary">Carregando...</p>;

  const chartData = summaries.map((s) => ({
    label: monthLabelShort(s.date),
    Receitas: s.income,
    Despesas: s.expenses,
    Saldo: s.income - s.expenses,
    Cartão: s.credit,
    Investimentos: s.investment,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Evolução" subtitle="Como as finanças da família mudaram nos últimos 6 meses">
        <MonthSelector date={date} onPrev={() => setDate(addMonths(date, -1))} onNext={() => setDate(addMonths(date, 1))} />
      </PageHeader>

      <Card>
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
            <Line type="monotone" dataKey="Receitas" stroke="rgb(var(--success-rgb) / 1)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Despesas" stroke="rgb(var(--danger-rgb) / 1)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Saldo" stroke="#2878F8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Cartão" stroke="rgb(var(--warning-rgb) / 1)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Investimentos" stroke="#7C5CFC" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="py-2 font-medium">Mês</th>
              <th className="py-2 text-right font-medium">Receitas</th>
              <th className="py-2 text-right font-medium">Investimentos</th>
              <th className="py-2 text-right font-medium">Despesas</th>
              <th className="py-2 pl-3 text-right font-medium border-l border-border" title="Cartão, Fixo e Variável são partes independentes das Despesas — juntas somam o total de Despesas, sem sobrepor.">
                Cartão
              </th>
              <th className="py-2 text-right font-medium">Fixo</th>
              <th className="py-2 pr-3 text-right font-medium border-r border-border">Variável</th>
              <th className="py-2 text-right font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.month} className="border-b border-border last:border-0">
                <td className="py-2 capitalize">{monthLabelShort(s.date)}</td>
                <td className="py-2 text-right tabular-nums text-success">{formatCurrency(s.income)}</td>
                <td className="py-2 text-right tabular-nums text-success">{formatCurrency(s.investment)}</td>
                <td className="py-2 text-right tabular-nums text-danger">{formatCurrency(s.expenses)}</td>
                <td className="py-2 pl-3 text-right tabular-nums border-l border-border">{formatCurrency(s.credit)}</td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(s.fixed)}</td>
                <td className="py-2 pr-3 text-right tabular-nums border-r border-border">{formatCurrency(s.variable)}</td>
                <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(s.income - s.expenses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3 className="mb-4 font-medium">Saúde financeira</h3>
        {(() => {
          const last = summaries[summaries.length - 1];
          if (!last || last.income === 0) return <p className="text-sm text-text-secondary">Sem dados suficientes neste mês.</p>;
          const commitment = last.expenses / last.income;
          const creditShare = last.credit / last.income;
          const investmentShare = last.investment / last.income;
          return (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Metric label="Comprometimento da renda" value={`${Math.round(commitment * 100)}%`} />
              <Metric label="Gastos no cartão" value={`${Math.round(creditShare * 100)}%`} />
              <Metric label="Gastos fixos" value={formatCurrency(last.fixed)} />
              <Metric label="Gastos variáveis" value={formatCurrency(last.variable)} />
              <Metric label="Investido da renda" value={`${Math.round(investmentShare * 100)}%`} />
            </div>
          );
        })()}
      </Card>

      <CreditCardReductionCard householdId={householdId} date={date} summaries={summaries} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-border p-3 text-center">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
