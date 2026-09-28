"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { PendingInvitation } from "@/lib/types";

/**
 * Card de largura total no dashboard (logo após os cards do topo) com os
 * convites recebidos, para aceitar ou recusar. Some sozinho quando não há
 * convite pendente.
 */
export function InvitationsBanner({ hasHousehold }: { hasHousehold: boolean }) {
  const supabase = createClient();
  const [invites, setInvites] = useState<PendingInvitation[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("my_pending_invitations");
    setInvites((data as PendingInvitation[]) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(id: string, accept: boolean) {
    setBusyId(id);
    setError(null);
    const { error } = await supabase.rpc("respond_to_invitation", { p_invitation_id: id, p_accept: accept });
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    if (accept) {
      // Mudou de planejamento: recarrega tudo para puxar os dados do novo.
      window.location.reload();
      return;
    }
    load();
  }

  if (invites.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {invites.map((inv) => (
        <GlassCard key={inv.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-text">
                <span className="font-semibold">{inv.inviter_name}</span> convidou você para participar do
                planejamento <span className="font-semibold">{inv.household_name}</span>.
              </p>
              <p className="text-xs text-text-secondary">
                Ao aceitar, você passa a ver e lançar os dados desse planejamento.
                {hasHousehold && " O seu planejamento atual só será descartado se estiver vazio."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" disabled={busyId === inv.id} onClick={() => respond(inv.id, false)}>
              Recusar
            </Button>
            <Button disabled={busyId === inv.id} onClick={() => respond(inv.id, true)}>
              Aceitar
            </Button>
          </div>
        </GlassCard>
      ))}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
