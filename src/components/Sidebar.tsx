"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarRange, CreditCard, TrendingUp, Tags, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meu-mes", label: "Meu mês", icon: CalendarRange },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

/**
 * Slim icon-only rail, always dark regardless of the page's own theme —
 * mirrors the reference screenshot. Labels move to native tooltips
 * (title attribute) so the nav stays usable without on-screen text.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center gap-2 bg-gradient-to-b from-[#140F27] to-[#0F0B1D] py-5 md:flex">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8D6CE6] to-[#5B3FD4] text-white">
        <Wallet className="h-5 w-5" />
      </div>
      <nav className="flex flex-1 flex-col items-center gap-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
                active ? "bg-white/15 text-white" : "text-white/45 hover:bg-white/10 hover:text-white/80"
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
