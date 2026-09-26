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

/**
 * Floating icon-only rail, fixed to the viewport so it never scrolls with
 * the page. Labels move to native tooltips (title attribute).
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
            <Link
              key={href}
              href={href}
              title={label}
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
          );
        })}
      </nav>

      <div className="h-px w-8 bg-white/10" />

      <button
        onClick={handleLogout}
        title="Sair"
        aria-label="Sair"
        className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/45 transition-colors hover:bg-[#D780D6]/15 hover:text-[#E5A6E1]"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </aside>
  );
}
