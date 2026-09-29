"use client";

import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";

/**
 * Trilho do menu + conteúdo ficam DENTRO do mesmo container centralizado
 * (1512px = 64 menu + 16 espaço + 1400 conteúdo + 2x16 de margem). Assim, em
 * telas acima de 1920px o menu acompanha o conteúdo em vez de ficar colado
 * na borda da janela, longe do centro. Abaixo de 1512px o resultado é
 * idêntico ao layout anterior.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1512px] px-4">
        {/* Coluna do menu (some no mobile). O <Sidebar> é sticky dentro dela. */}
        <div className="mr-4 hidden w-16 shrink-0 md:block">
          <Sidebar />
        </div>

        <div className="min-w-0 flex-1">
          <TopNav />
          <main className="pb-24 pt-2 md:pb-10">{children}</main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
