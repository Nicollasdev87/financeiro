"use client";

import { Wallet } from "lucide-react";
import { ProfileChip } from "@/components/ProfileChip";

/**
 * Brand chip + profile chip. Part of the normal page flow (not fixed), so it
 * scrolls away with the rest of the page — navigation now lives only in the
 * rail on the left.
 */
export function TopNav() {
  return (
    <div className="hidden w-full items-center justify-between py-4 md:flex">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-b from-[#140F27] to-[#0F0B1D] px-4 py-2.5 shadow-lg shadow-black/30">
        <Wallet className="h-4 w-4 text-[#B7A3F5]" />
        <span className="text-sm font-semibold text-white">GrannaUp</span>
      </div>

      <ProfileChip />
    </div>
  );
}
