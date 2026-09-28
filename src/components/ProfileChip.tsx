"use client";

import Link from "next/link";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function ProfileChip() {
  const { name, avatarUrl, userCode, loading } = useCurrentUser();

  if (loading || !name) return null;

  return (
    <Link
      href="/perfil"
      className="flex items-center gap-2 rounded-card border border-border bg-surface py-1.5 pl-1.5 pr-4 transition-colors hover:bg-surface-secondary"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
          {initials(name)}
        </div>
      )}
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="max-w-[120px] truncate text-sm font-medium text-text">{name}</span>
        {userCode && <span className="text-[11px] font-light tracking-wide text-text-tertiary">{userCode}</span>}
      </div>
    </Link>
  );
}
