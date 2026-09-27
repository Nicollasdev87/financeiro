"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  PiggyBank,
  TrendingUp,
  Tags,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meu-mes", label: "Meu mês", icon: CalendarRange },
  { href: "/investimentos", label: "Investimentos", icon: PiggyBank },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

/** Small floating label that appears to the right of an icon on hover. */
function HoverLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-control border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text opacity-0 shadow-card transition-opacity duration-150 group-hover:opacity-100">
      {children}
    </span>
  );
}

/**
 * Rail lateral fixo, integrado ao fundo do app (mesma cor de base, sem
 * cartão/sombra pesada). Hover em cada ícone revela o nome do item.
 */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed left-4 top-4 z-40 hidden w-16 flex-col items-center gap-5 rounded-card border border-border bg-background-secondary py-5 md:flex">
      <nav className="flex flex-col items-center gap-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <div key={href} className="group relative">
              <Link
                href={href}
                aria-label={label}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-control transition-colors",
                  active ? "bg-surface text-primary" : "text-text-tertiary hover:bg-surface-elevated hover:text-text"
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
              <HoverLabel>{label}</HoverLabel>
            </div>
          );
        })}
      </nav>

      <div className="h-px w-8 bg-border" />

      <div className="group relative">
        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="flex h-10 w-10 items-center justify-center rounded-control text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-5 w-5" />
        </button>
        <HoverLabel>Sair</HoverLabel>
      </div>
    </aside>
  );
}
