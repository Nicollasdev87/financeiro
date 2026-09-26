"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { createClient } from "@/lib/supabase/client";

const MEMBER_COLORS = ["#7C5CFC", "#3B82F6", "#22A06B", "#D99A00"];

export default function ConfiguracoesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { householdId, members, reload, loading } = useHouseholdData();
  const [householdName, setHouseholdName] = useState("Minha Família");
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberName, setMemberName] = useState("");

  async function createHousehold(e: React.FormEvent) {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: household } = await supabase
      .from("households")
      .insert({ name: householdName, created_by: userId })
      .select("id")
      .single();

    if (household) {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
      await supabase.from("household_members").insert({
        household_id: household.id,
        profile_id: userId,
        display_name: profile?.full_name ?? "Eu",
        color: MEMBER_COLORS[0],
      });
    }
    reload();
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId) return;
    // Segunda pessoa sem login próprio: fica sem profile_id — é apenas um
    // perfil de lançamento dentro da mesma household (sem convite por e-mail no MVP).
    await supabase.from("household_members").insert({
      household_id: householdId,
      profile_id: null,
      display_name: memberName,
      color: MEMBER_COLORS[members.length % MEMBER_COLORS.length],
    });
    setMemberName("");
    setMemberOpen(false);
    reload();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return <p className="text-sm text-text-secondary">Carregando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-text-secondary">Família, membros e conta</p>
      </div>

      {!householdId ? (
        <Card>
          <EmptyState
            title="Vamos organizar suas finanças?"
            description="Crie sua família para começar a lançar receitas e despesas."
          />
          <form onSubmit={createHousehold} className="mt-4 flex gap-2">
            <Input value={householdName} onChange={(e) => setHouseholdName(e.target.value)} placeholder="Nome da família" />
            <Button type="submit">Criar</Button>
          </form>
        </Card>
      ) : (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">Membros da família</h3>
            <Button size="sm" variant="secondary" onClick={() => setMemberOpen(true)}>
              <Plus className="h-4 w-4" /> Adicionar pessoa
            </Button>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                {m.display_name}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-3 font-medium">Conta</h3>
        <Button variant="danger" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </Card>

      <Modal open={memberOpen} onClose={() => setMemberOpen(false)} title="Adicionar pessoa">
        <form onSubmit={addMember} className="flex flex-col gap-3">
          <Input placeholder="Nome da pessoa" value={memberName} onChange={(e) => setMemberName(e.target.value)} required />
          <Button type="submit">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
