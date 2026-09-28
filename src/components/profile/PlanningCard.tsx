"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Link2, Send, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { useHouseholdData } from "@/lib/hooks/useHouseholdData";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { MAX_HOUSEHOLD_MEMBERS, type SentInvitation } from "@/lib/types";
import { buildInviteLink, copyToClipboard, formatUserCodeInput } from "@/lib/userCode";

export function PlanningCard() {
  const supabase = createClient();
  const { id: myId } = useCurrentUser();
  const { householdId, members, loading, reload } = useHouseholdData();

  const [sent, setSent] = useState<SentInvitation[]>([]);
  const [code, setCode] = useState("");
  const [linkMemberId, setLinkMemberId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadSent = useCallback(async () => {
    const { data } = await supabase.rpc("my_household_invitations");
    setSent((data as SentInvitation[]) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (householdId) loadSent();
  }, [householdId, loadSent]);

  const unlinkedMembers = members.filter((m) => m.profile_id === null);
  const isFull = members.length >= MAX_HOUSEHOLD_MEMBERS;

  async function handleInviteByCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.rpc("create_invitation_by_code", {
      p_code: code,
      p_member_id: linkMemberId || null,
    });
    setBusy(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "ok", text: `Convite enviado para ${data}. Ele aparece no dashboard dessa pessoa.` });
    setCode("");
    setLinkMemberId("");
    loadSent();
  }

  async function handleCreateLink() {
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.rpc("create_invite_link", { p_member_id: linkMemberId || null });
    setBusy(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    const link = buildInviteLink(window.location.origin, data as string);
    const copied = await copyToClipboard(link);
    setMessage({
      type: "ok",
      text: copied
        ? "Link gerado e copiado! Vale por 7 dias e serve para uma única pessoa."
        : "Link gerado (copie abaixo). Vale por 7 dias e serve para uma única pessoa.",
    });
    setLinkMemberId("");
    loadSent();
  }

  async function handleCancel(id: string) {
    setBusy(true);
    const { error } = await supabase.rpc("cancel_invitation", { p_invitation_id: id });
    setBusy(false);
    if (error) setMessage({ type: "error", text: error.message });
    loadSent();
  }

  async function handleCopyLink(inv: SentInvitation) {
    if (await copyToClipboard(buildInviteLink(window.location.origin, inv.code))) {
      setCopiedKey(inv.id);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  }

  if (loading) return <Card><p className="text-sm text-text-secondary">Carregando...</p></Card>;

  if (!householdId) {
    return (
      <Card>
        <h3 className="font-medium">Planejamento</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Você ainda não faz parte de um planejamento. Se alguém te convidou, o convite aparece no dashboard para
          você aceitar. Ou crie o seu próprio:
        </p>
        <Link
          href="/configuracoes"
          className="mt-3 inline-flex h-10 items-center rounded-control bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Criar meu planejamento
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Planejamento</h3>
        <span className="text-sm text-text-secondary">
          {members.length}/{MAX_HOUSEHOLD_MEMBERS} pessoas
        </span>
      </div>

      <div className="mt-3 flex flex-col divide-y divide-border">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2 py-2.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
            {m.display_name}
            {m.profile_id === myId && <Badge>Você</Badge>}
            {m.profile_id === null && <Badge tone="warning">Sem login</Badge>}
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <h4 className="text-sm font-medium">Convidar alguém</h4>
        <p className="mt-1 text-sm text-text-secondary">
          Use o código de usuário da pessoa (#A62-087) ou gere um link de cadastro para quem ainda não tem conta.
          Cada pessoa só pode participar de 1 planejamento, e cada planejamento tem até {MAX_HOUSEHOLD_MEMBERS} pessoas.
        </p>

        {isFull && (
          <p className="mt-2 text-sm text-warning">O planejamento já está com {MAX_HOUSEHOLD_MEMBERS} pessoas.</p>
        )}

        {unlinkedMembers.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Vincular a uma pessoa que já existe no planejamento (opcional — mantém o histórico dela)
            </label>
            <Select value={linkMemberId} onChange={(e) => setLinkMemberId(e.target.value)} className="w-full max-w-xs">
              <option value="">Nova pessoa</option>
              {unlinkedMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </Select>
          </div>
        )}

        <form onSubmit={handleInviteByCode} className="mt-3 flex flex-wrap gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(formatUserCodeInput(e.target.value))}
            placeholder="#A62-087"
            className="w-40 font-mono uppercase"
            required
            maxLength={8}
          />
          <Button type="submit" disabled={busy || code.length < 8 || (isFull && !linkMemberId)}>
            <Send className="h-4 w-4" /> Convidar
          </Button>
          <Button type="button" variant="secondary" disabled={busy || (isFull && !linkMemberId)} onClick={handleCreateLink}>
            <Link2 className="h-4 w-4" /> Gerar link de cadastro
          </Button>
        </form>

        {message && (
          <p className={`mt-3 text-sm ${message.type === "ok" ? "text-success" : "text-danger"}`}>{message.text}</p>
        )}
      </div>

      {sent.length > 0 && (
        <div className="mt-5 border-t border-border pt-5">
          <h4 className="text-sm font-medium">Convites pendentes</h4>
          <div className="mt-2 flex flex-col divide-y divide-border">
            {sent.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div className="flex flex-col">
                  <span>{inv.invitee_label}</span>
                  <span className="font-mono text-xs text-text-secondary">{inv.code}</span>
                </div>
                <div className="flex items-center gap-1">
                  {inv.is_link && (
                    <Button size="sm" variant="ghost" onClick={() => handleCopyLink(inv)}>
                      {copiedKey === inv.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copiar link
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => handleCancel(inv.id)}>
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
