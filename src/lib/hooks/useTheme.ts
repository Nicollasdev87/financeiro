"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem("theme") as Theme | null)) || "dark";
    setThemeState(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
