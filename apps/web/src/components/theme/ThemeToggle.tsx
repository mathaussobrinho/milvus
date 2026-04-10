"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "visohelp-theme";

function readStoredTheme(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "dark") return true;
    if (v === "light") return false;
  } catch {
    /* ignore */
  }
  return false;
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const d = readStoredTheme();
    setDark(d);
    applyDark(d);
  }, []);

  const toggle = useCallback(() => {
    const next = !dark;
    setDark(next);
    applyDark(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface"
      title={dark ? "Modo claro" : "Modo escuro"}
      aria-pressed={dark}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      <span className="text-base leading-none" aria-hidden>
        {dark ? "☀️" : "🌙"}
      </span>
      <span className="hidden sm:inline">
        {dark ? "Modo claro" : "Modo escuro"}
      </span>
    </button>
  );
}
