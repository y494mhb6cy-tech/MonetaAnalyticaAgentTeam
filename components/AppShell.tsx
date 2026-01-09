"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = () => {
      const isDeep = window.localStorage.getItem("moneta-analytica-deep-mode") === "true";
      document.documentElement.classList.toggle("theme-deep", isDeep);
    };
    applyTheme();
    const handleStorage = () => applyTheme();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("maos:theme", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("maos:theme", handleStorage);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)]">
      <Sidebar />
      <div className="flex-1 flex min-w-0 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-6">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Moneta Analytica OS</div>
          <button
            type="button"
            className="rounded-md border border-[var(--border)] bg-[var(--panel2)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)]"
            onClick={() => window.dispatchEvent(new CustomEvent("maos:command-palette"))}
          >
            Cmd + K
          </button>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
