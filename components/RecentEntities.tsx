"use client";

import { useMaosStore } from "../lib/maos-store";

export function RecentEntities({ onSelect }: { onSelect: (entity: { id: string; kind: "personnel" | "agent" }) => void }) {
  const { recentEntities } = useMaosStore();

  if (recentEntities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-xl border border-[color:var(--border)] bg-[var(--panel2)] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Recent</div>
      <div className="space-y-2 text-sm">
        {recentEntities.map((entity) => (
          <button
            key={`${entity.kind}-${entity.id}`}
            type="button"
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-[color:var(--text)] hover:bg-[var(--hover)]"
            onClick={() => onSelect({ id: entity.id, kind: entity.kind })}
          >
            <div>
              <div className="text-sm font-semibold text-[color:var(--text)]">{entity.name}</div>
              <div className="text-xs text-[color:var(--muted)]">{entity.subtitle}</div>
            </div>
            <span className="text-xs text-[color:var(--muted)]">{entity.kind === "personnel" ? "👤" : "🤖"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
