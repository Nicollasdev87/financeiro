"use client";

import { Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileChip } from "@/components/ProfileChip";

/**
 * Brand chip + toggle de tema + chip de perfil. Parte do fluxo normal da
 * página (não fixo), então rola junto com o conteúdo.
 */
export function TopNav() {
  return (
    <div className="hidden w-full items-center justify-between py-4 md:flex">
      <div className="flex items-center gap-2 rounded-card border border-border bg-surface px-4 py-2.5">
        <Wallet className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-text">GrannaUp</span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <ProfileChip />
      </div>
    </div>
  );
}
