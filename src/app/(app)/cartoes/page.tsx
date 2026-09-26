"use client";

import { useMemo, useState } from "react";
import { Plus, CreditCard as CardIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { useMonthData } from "@/lib/hooks/useMonthData";
import { useMonthsSummary } from "@/lib/hooks/useMonthsSummary";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

export default function CartoesPage() {
  const [date] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { householdId, cards, reload, loading } = useHouseholdData();
  const { expenses } = useMonthData(householdId, date);
  const { summaries } = useMonthsSummary(householdId, date, 2);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", bank: "", credit_limit: "", monthly_goal: "", closing_day: "1", due_day: "10" });
  const supabase = createClient();

  const currentMonthCredit = expenses.reduce(
    (s, e) => s + e.payments.filter((p) => p.method === "credit").reduce((s2, p) => s2 + p.amount, 0),
    0
  );
  const previousMonthCredit = summaries[0]?.credit ?? 0;
  const diff = previousMonthCredit - currentMonthCredit;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId) return;
    await supabase.from("credit_cards").insert({
      household_id: householdId,
      name: form.name,
      bank: form.bank || null,
      credit_limit: Number(form.credit_limit) || 0,
      monthly_goal: Number(form.monthly_goal) || 0,
      closing_day: Number(form.closing_day) || 1,
      due_day: Number(form.due_day) || 10,
    });
    setOpen(false);
    setForm({ name: "", bank: "", credit_limit: "", monthly_goal: "", closing_day: "1", due_day: "10" });
    reload();
  }

  if (loading) return <p className="text-sm text-text-secondary">Carregando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cartões</h1>
          <p className="text-sm text-text-secondary">Controle de limite e meta mensal</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Novo cartão
        </Button>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={<CardIcon className="h-8 w-8" />}
          title="Nenhum cartão cadastrado"
          description="Cadastre seus cartões para acompanhar limite, utilização e metas."
          action={<Button onClick={() => setOpen(true)}>Cadastrar cartão</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const used = currentMonthCredit; // MVP: uma fatura agregada de crédito por household
            const available = Math.max(0, card.credit_limit - used);
            const usagePct = card.credit_limit > 0 ? Math.round((used / card.credit_limit) * 100) : 0;
            const overGoal = used - card.monthly_goal;

            return (
              <Card key={card.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">{card.name}</h3>
                  <span className="text-xs text-text-secondary">{card.bank}</span>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-text-secondary">Limite</p>
                    <p className="font-medium tabular-nums">{formatCurrency(card.credit_limit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Utilizado</p>
                    <p className="font-medium tabular-nums text-danger">{formatCurrency(used)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Disponível</p>
                    <p className="font-medium tabular-nums text-success">{formatCurrency(available)}</p>
                  </div>
                </div>

                <ProgressBar value={used} max={card.credit_limit || 1} />
                <p className="mt-1 text-xs text-text-secondary">Utilização: {usagePct}%</p>

                {card.monthly_goal > 0 && (
                  <div className="mt-4 rounded-control bg-primary-light p-3">
                    <p className="text-sm font-medium text-primary-dark">
                      Meta do mês: {formatCurrency(card.monthly_goal)}
                    </p>
                    <ProgressBar value={used} max={card.monthly_goal} className="mt-2" />
                    <p className="mt-1 text-xs text-text-secondary">
                      {overGoal > 0
                        ? `Você está ${formatCurrency(overGoal)} acima da sua meta.`
                        : `Você está ${formatCurrency(-overGoal)} dentro da sua meta.`}
                    </p>
                    {previousMonthCredit > 0 && (
                      <p className="mt-1 text-xs text-text-secondary">
                        {diff >= 0
                          ? `Redução de ${formatCurrency(diff)} em relação ao mês anterior.`
                          : `Aumento de ${formatCurrency(-diff)} em relação ao mês anterior.`}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo cartão">
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <Input placeholder="Nome (ex: Nubank)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Banco" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
          <Input placeholder="Limite" inputMode="decimal" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} />
          <Input placeholder="Meta mensal" inputMode="decimal" value={form.monthly_goal} onChange={(e) => setForm({ ...form, monthly_goal: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Dia de fechamento" inputMode="numeric" value={form.closing_day} onChange={(e) => setForm({ ...form, closing_day: e.target.value })} />
            <Input placeholder="Dia de vencimento" inputMode="numeric" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} />
          </div>
          <Button type="submit" className="mt-1">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
