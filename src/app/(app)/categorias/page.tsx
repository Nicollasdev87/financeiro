"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, ArrowDownAZ } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryKind, CategoryNature } from "@/lib/types";

const COLORS = ["#7C5CFC", "#3B82F6", "#22A06B", "#D99A00", "#D64545", "#5B3FD4", "#6B7280"];

export default function CategoriasPage() {
  const { householdId, categories, reload, loading } = useHouseholdData();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: "",
    kind: "expense" as CategoryKind,
    nature: "variable" as CategoryNature,
    color: COLORS[0],
    description: "",
  });

  function openNew() {
    setEditing(null);
    setForm({ name: "", kind: "expense", nature: "variable", color: COLORS[0], description: "" });
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({
      name: cat.name,
      kind: cat.kind,
      nature: cat.nature,
      color: cat.color,
      description: cat.description ?? "",
    });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId) return;

    if (editing) {
      await supabase
        .from("categories")
        .update({
          name: form.name,
          kind: form.kind,
          nature: form.nature,
          color: form.color,
          description: form.description || null,
        })
        .eq("id", editing.id);
    } else {
      await supabase.from("categories").insert({
        household_id: householdId,
        name: form.name,
        kind: form.kind,
        nature: form.nature,
        color: form.color,
        description: form.description || null,
        icon: "circle",
        sort_order: categories.length,
      });
    }
    setOpen(false);
    reload();
  }

  async function toggleActive(cat: Category) {
    await supabase.from("categories").update({ active: !cat.active }).eq("id", cat.id);
    reload();
  }

  async function remove(cat: Category) {
    if (!confirm(`Excluir a categoria "${cat.name}"? Isso também remove os lançamentos associados.`)) return;
    await supabase.from("categories").delete().eq("id", cat.id);
    reload();
  }

  /**
   * Ordena as categorias de um tipo (despesa/receita) de A-Z, mas sempre
   * com as Fixas primeiro e as Variáveis depois — a mesma regra usada
   * para exibição em "Meu mês". Persiste a nova ordem em sort_order.
   */
  async function sortAlphabetically(kind: CategoryKind) {
    const group = categories.filter((c) => c.kind === kind);
    const fixed = group
      .filter((c) => c.nature === "fixed")
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const variable = group
      .filter((c) => c.nature === "variable")
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const ordered = [...fixed, ...variable];

    await Promise.all(
      ordered.map((cat, index) => supabase.from("categories").update({ sort_order: index }).eq("id", cat.id))
    );
    reload();
  }

  if (loading) return <p className="text-sm text-text-secondary">Carregando...</p>;

  const income = categories.filter((c) => c.kind === "income");
  const expense = categories.filter((c) => c.kind === "expense");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Categorias</h1>
          <p className="text-sm text-text-secondary">Organize receitas e despesas</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <Section
        title="Despesas"
        categories={expense}
        onEdit={openEdit}
        onToggle={toggleActive}
        onDelete={remove}
        onSortAZ={() => sortAlphabetically("expense")}
      />
      <Section
        title="Receitas"
        categories={income}
        onEdit={openEdit}
        onToggle={toggleActive}
        onDelete={remove}
        onSortAZ={() => sortAlphabetically("income")}
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar categoria" : "Nova categoria"}>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as CategoryKind })}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </Select>
            <Select value={form.nature} onChange={(e) => setForm({ ...form, nature: e.target.value as CategoryNature })}>
              <option value="variable">Variável</option>
              <option value="fixed">Fixo</option>
            </Select>
          </div>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className="h-7 w-7 rounded-full ring-offset-2"
                style={{ backgroundColor: c, boxShadow: form.color === c ? `0 0 0 2px ${c}` : undefined }}
              />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">
              Descrição (aparece ao expandir a categoria em Meu mês)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: mercado, feira, delivery, restaurante..."
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

function Section({
  title,
  categories,
  onEdit,
  onToggle,
  onDelete,
  onSortAZ,
}: {
  title: string;
  categories: Category[];
  onEdit: (c: Category) => void;
  onToggle: (c: Category) => void;
  onDelete: (c: Category) => void;
  onSortAZ: () => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        {categories.length > 1 && (
          <button
            onClick={onSortAZ}
            className="flex items-center gap-1.5 rounded-control px-2 py-1 text-xs text-text-secondary hover:bg-black/5"
            title="Ordenar categorias de A a Z (Fixas primeiro, depois Variáveis)"
          >
            <ArrowDownAZ className="h-3.5 w-3.5" />
            Ordenar A-Z
          </button>
        )}
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhuma categoria ainda.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className={cat.active ? "" : "text-text-secondary line-through"}>{cat.name}</span>
                <Badge tone="neutral">{cat.nature === "fixed" ? "Fixo" : "Variável"}</Badge>
                {!cat.active && <Badge tone="warning">Inativa</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onToggle(cat)} className="rounded-control px-2 py-1 text-xs text-text-secondary hover:bg-black/5">
                  {cat.active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => onEdit(cat)} className="rounded-control p-1.5 hover:bg-black/5">
                  <Pencil className="h-4 w-4 text-text-secondary" />
                </button>
                <button onClick={() => onDelete(cat)} className="rounded-control p-1.5 hover:bg-black/5">
                  <Trash2 className="h-4 w-4 text-danger" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
