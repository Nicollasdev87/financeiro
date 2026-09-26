"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileChip } from "@/components/ProfileChip";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/meu-mes", label: "Meu mês" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/evolucao", label: "Evolução" },
  { href: "/categorias", label: "Categorias" },
  { href: "/configuracoes", label: "Configurações" },
];

/**
 * Floating brand chip + nav pills (left) and profile chip (right), fixed to
 * the viewport so none of it scrolls with the page. Aligned to start right
 * after the rail (see AppShell for the matching offset).
 */
export function TopNav() {
  const pathname = usePathname();

  return (
    <div className="fixed left-24 right-4 top-4 z-40 hidden justify-center md:flex">
      <div className="flex w-full max-w-[1400px] flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-b from-[#140F27] to-[#0F0B1D] px-4 py-2.5 shadow-lg shadow-black/30">
          <Wallet className="h-4 w-4 text-[#B7A3F5]" />
          <span className="text-sm font-semibold text-white">GrannaUp</span>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/30 transition-colors",
                  active
                    ? "border-transparent bg-gradient-to-br from-[#8D6CE6] to-[#5B3FD4] text-white"
                    : "border-white/10 bg-gradient-to-b from-[#140F27] to-[#0F0B1D] text-white/55 hover:text-white/85"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <ProfileChip />
        </div>
      </div>
    </div>
  );
}
