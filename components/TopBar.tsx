"use client";

import { Button } from "./ui";
import { useMaosStore } from "../lib/maos-store";

export function TopBar() {
  const { setAiPanelOpen } = useMaosStore();

  return (
    <div className="flex items-center justify-between border-b border-[color:var(--border)] bg-[var(--panel)] px-5 py-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text)]">MAOS</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-xs text-[color:var(--muted)] md:block">Cmd/Ctrl + K</div>
        <Button size="sm" onClick={() => setAiPanelOpen(true)}>
          AI Preview
        </Button>
      </div>
    </div>
  );
}
