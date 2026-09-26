"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  CreditCard,
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
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

/** Small floating label that appears to the right of an icon on hover. */
function HoverLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#1C1533] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg shadow-black/30 transition-opacity duration-150 group-hover:opacity-100">
      {children}
    </span>
  );
}

/**
 * Floating icon-only rail, fixed to the viewport so it never scrolls with
 * the page. Hovering an icon reveals its name in a small floating label.
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
    <aside className="fixed left-4 top-4 z-40 hidden w-16 flex-col items-center gap-5 rounded-[28px] border border-white/10 bg-gradient-to-b from-[#140F27] to-[#0F0B1D] py-5 shadow-xl shadow-black/30 md:flex">
      <nav className="flex flex-col items-center gap-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <div key={href} className="group relative">
              <Link
                href={href}
                aria-label={label}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition-colors",
                  active
                    ? "bg-gradient-to-br from-[#8D6CE6] to-[#5B3FD4] text-white"
                    : "text-white/45 hover:bg-white/10 hover:text-white/80"
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
              <HoverLabel>{label}</HoverLabel>
            </div>
          );
        })}
      </nav>

      <div className="h-px w-8 bg-white/10" />

      <div className="group relative">
        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/45 transition-colors hover:bg-[#D780D6]/15 hover:text-[#E5A6E1]"
        >
          <LogOut className="h-5 w-5" />
        </button>
        <HoverLabel>Sair</HoverLabel>
      </div>
    </aside>
  );
}
