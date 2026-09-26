"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UserPill() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = email ? email.split("@")[0] : "Conta";
  const initial = label.slice(0, 1).toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary-contrast">
        {initial}
      </span>
      <span className="max-w-[140px] truncate text-sm font-medium text-text">{label}</span>
    </div>
  );
}
