"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthPanel } from "@/components/auth/AuthPanel";

const COPY: Record<string, { title: string; subtitle: string }> = {
  "/login": {
    title: "Organize as finanças de casa",
    subtitle: "Receitas, despesas e investimentos, tudo num só lugar.",
  },
  "/cadastro": {
    title: "Comece a organizar hoje",
    subtitle: "Crie sua conta e tenha clareza sobre para onde vai o dinheiro.",
  },
  "/recuperar-senha": {
    title: "Vamos recuperar seu acesso",
    subtitle: "Enviamos um link para você criar uma nova senha com segurança.",
  },
  "/redefinir-senha": {
    title: "Quase lá",
    subtitle: "Defina uma nova senha para continuar organizando as finanças.",
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const copy = COPY[pathname] ?? COPY["/login"];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex w-full flex-col lg:w-1/2">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Link href="/login" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-white">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="font-semibold">Grannaup</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>

      <div className="hidden flex-1 p-4 lg:flex">
        <AuthPanel title={copy.title} subtitle={copy.subtitle} />
      </div>
    </div>
  );
}
