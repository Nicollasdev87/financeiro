"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const PROFILE_UPDATED_EVENT = "grannaup:profile-updated";

/** Avisa todos os useCurrentUser da tela (ex: o chip do topo) para recarregar. */
export function notifyProfileUpdated() {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function useCurrentUser() {
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const active = useRef(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      if (active.current) setLoading(false);
      return;
    }

    // Se as colunas novas ainda não existirem (patch não rodado), o select
    // falha e caímos nos valores do metadata — o app continua funcionando.
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, user_code")
      .eq("id", user.id)
      .single();

    if (!active.current) return;
    setId(user.id);
    setEmail(user.email ?? null);
    setName(profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Usuário");
    setAvatarUrl(profile?.avatar_url ?? user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null);
    setUserCode(profile?.user_code ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    active.current = true;
    load();
    const onUpdate = () => load();
    window.addEventListener(PROFILE_UPDATED_EVENT, onUpdate);
    return () => {
      active.current = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, onUpdate);
    };
  }, [load]);

  return { id, name, email, avatarUrl, userCode, loading, reload: load };
}
