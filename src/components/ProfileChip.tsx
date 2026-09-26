"use client";

import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function ProfileChip() {
  const { name, avatarUrl, loading } = useCurrentUser();

  if (loading || !name) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-b from-[#140F27] to-[#0F0B1D] py-1.5 pl-1.5 pr-4 shadow-lg shadow-black/30">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8D6CE6] to-[#5B3FD4] text-xs font-semibold text-white">
          {initials(name)}
        </div>
      )}
      <span className="max-w-[120px] truncate text-sm font-medium text-white">{name}</span>
    </div>
  );
}
