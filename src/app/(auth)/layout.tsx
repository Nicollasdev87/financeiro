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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-10">
      {/* Degradê suave por trás do card — usa os próprios tokens de cor do
          app (azul + verde), então funciona nos dois temas sem destoar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 12% 8%, rgb(var(--blue-active-rgb) / 0.14), transparent 60%), " +
            "radial-gradient(ellipse 55% 50% at 88% 95%, rgb(var(--success-rgb) / 0.12), transparent 60%)",
        }}
      />

      {/* O card em si: um único bloco com o degradê (mesmo tom da ilustração)
          "englobando" tudo — o formulário fica como um cartão branco
          flutuando por cima desse degradê, em vez de dividir a tela em duas
          cores estanques. */}
      <div className="relative grid w-full max-w-[1040px] grid-cols-1 gap-3 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0B1220] via-[#12203A] to-[#184787] p-3 shadow-2xl sm:p-4 lg:min-h-[600px] lg:grid-cols-[1fr_1.05fr] lg:gap-4 lg:p-4">
        <div className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
          <header className="flex items-center justify-between px-6 pt-6 sm:px-10">
            <Link href="/login" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-white">
                <Wallet className="h-4 w-4" />
              </span>
              <span className="font-semibold">Grannaup</span>
            </Link>
            <ThemeToggle />
          </header>

          <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
            <div className="w-full max-w-sm">{children}</div>
          </main>
        </div>

        <div className="hidden lg:block">
          <AuthPanel title={copy.title} subtitle={copy.subtitle} />
        </div>
      </div>
    </div>
  );
}
