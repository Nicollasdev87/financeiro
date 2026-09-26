"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useCurrentUser() {
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || !active) {
        if (active) setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

      if (!active) return;
      setName(profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Usuário");
      setAvatarUrl(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return { name, avatarUrl, loading };
}
