"use client";

import { ReactNode, useEffect, useState } from "react";
import { Theme, ThemeContext } from "@/lib/theme";

const STORAGE_KEY = "theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // O valor inicial real já foi aplicado no <html> por um script inline
  // (ver app/layout.tsx) antes do React montar, pra não piscar o tema errado.
  // Aqui só sincronizamos o estado do React com o que já está no DOM.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(current);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage indisponível (modo privado etc.) — o tema ainda
        // funciona nesta sessão, só não persiste entre visitas.
      }
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
