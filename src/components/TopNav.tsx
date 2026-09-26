"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/meu-mes", label: "Meu mês" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/evolucao", label: "Evolução" },
  { href: "/categorias", label: "Categorias" },
  { href: "/configuracoes", label: "Configurações" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30 hidden w-full bg-gradient-to-b from-[#140F27] to-[#0F0B1D] px-4 py-3 md:block">
      <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
        {NAV.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
