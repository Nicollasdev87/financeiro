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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-white">
          <Wallet className="h-4 w-4" />
        </div>
        <span className="font-semibold">Organizador</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-light text-primary-dark"
                  : "text-text-secondary hover:bg-black/5 hover:text-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
