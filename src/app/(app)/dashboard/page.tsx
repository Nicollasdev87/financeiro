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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FinancialCard } from "@/components/FinancialCard";
import { Card } from "@/components/ui/Card";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { useMonthData } from "@/lib/hooks/useMonthData";
import { useMonthsSummary } from "@/lib/hooks/useMonthsSummary";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact, monthLabel, monthLabelShort } from "@/lib/utils";

const PIE_COLORS = ["#7C5CFC", "#3B82F6", "#22A06B", "#D99A00", "#D64545", "#6B7280", "#5B3FD4"];

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
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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

      <Card>
        <h3 className="mb-4 font-medium">Receitas x Despesas</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={summaries.map((s) => ({ ...s, label: monthLabelShort(s.date) }))}>
            <CartesianGrid vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => formatCurrencyCompact(v)} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="income" name="Receitas" fill="#22A06B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Despesas" fill="#D64545" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-medium">Gastos por categoria</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-text-secondary">Nenhum gasto lançado neste mês.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-medium">Gastos por forma de pagamento</h3>
          {byMethod.length === 0 ? (
            <p className="text-sm text-text-secondary">Nenhum gasto lançado neste mês.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byMethod} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {byMethod.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 font-medium">Quem gastou?</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {byPerson.map(({ member, income, expenses: exp }) => (
            <div key={member.id} className="rounded-control border border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: member.color }} />
                <span className="font-medium">{member.display_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Receitas</span>
                <span className="tabular-nums text-success">{formatCurrency(income)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Despesas</span>
                <span className="tabular-nums text-danger">{formatCurrency(exp)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
