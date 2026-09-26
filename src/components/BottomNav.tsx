"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, CalendarRange, CreditCard, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meu-mes", label: "Meu mês", icon: CalendarRange },
];

const MORE_ITEMS = [
  { href: "/evolucao", label: "Evolução" },
  { href: "/categorias", label: "Categorias" },
  { href: "/configuracoes", label: "Configurações" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-surface px-2 py-2 pb-[env(safe-area-inset-bottom,0px)] md:hidden">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-1 text-xs",
                active ? "text-primary" : "text-text-secondary"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}

        <button
          onClick={() => setAddOpen(true)}
          className="mx-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-card"
          aria-label="Adicionar"
        >
          <Plus className="h-6 w-6" />
        </button>

        <Link
          href="/cartoes"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-1 text-xs",
            pathname.startsWith("/cartoes") ? "text-primary" : "text-text-secondary"
          )}
        >
          <CreditCard className="h-5 w-5" />
          Cartões
        </Link>

        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-1 text-xs text-text-secondary"
        >
          <MoreHorizontal className="h-5 w-5" />
          Mais
        </button>
      </nav>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar">
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setAddOpen(false);
              router.push("/meu-mes?add=income");
            }}
          >
            Adicionar receita
          </Button>
          <Button
            onClick={() => {
              setAddOpen(false);
              router.push("/meu-mes?add=expense");
            }}
          >
            Adicionar despesa
          </Button>
        </div>
      </Modal>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais">
        <div className="flex flex-col gap-1">
          {MORE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className="rounded-control px-3 py-2 text-sm hover:bg-black/5"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Modal>
    </>
  );
}
