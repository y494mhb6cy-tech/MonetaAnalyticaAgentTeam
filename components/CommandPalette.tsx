"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useMaosStore } from "../lib/maos-store";

const navCommands = [
  { id: "map", label: "Go to Map", href: "/map" },
  { id: "personnel", label: "Go to Personnel", href: "/personnel" },
  { id: "agents", label: "Go to Agents", href: "/agents" },
  { id: "builder", label: "Go to Builder", href: "/builder/tasks" },
  { id: "settings", label: "Go to Settings", href: "/settings" }
];

type CommandResult =
  | { type: "nav"; id: string; label: string; href: string }
  | { type: "personnel"; id: string; label: string; description: string; href: string }
  | { type: "agent"; id: string; label: string; description: string; href: string };

export function CommandPalette() {
  const router = useRouter();
  const { personnel, agents } = useMaosStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isCmdK) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const navResults = navCommands
      .filter((item) => !normalized || item.label.toLowerCase().includes(normalized))
      .map((item) => ({ type: "nav" as const, ...item }));

    const personnelResults = personnel
      .filter((person) => !normalized || person.name.toLowerCase().includes(normalized) || person.title.toLowerCase().includes(normalized))
      .slice(0, 6)
      .map((person) => ({
        type: "personnel" as const,
        id: person.id,
        label: person.name,
        description: `${person.title} · ${person.team}`,
        href: `/personnel?select=${person.id}`
      }));

    const agentResults = agents
      .filter((agent) => !normalized || agent.name.toLowerCase().includes(normalized) || agent.module.toLowerCase().includes(normalized))
      .slice(0, 6)
      .map((agent) => ({
        type: "agent" as const,
        id: agent.id,
        label: agent.name,
        description: `${agent.module} · ${agent.ownerTeam}`,
        href: `/agents?select=${agent.id}`
      }));

    return [...navResults, ...personnelResults, ...agentResults];
  }, [agents, personnel, query]);

  const handleSelect = (result: CommandResult) => {
    router.push(result.href);
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-24 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[color:var(--border)] bg-[var(--panel)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[color:var(--border)] px-4 py-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or jump to…"
            className="w-full bg-transparent text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none"
          />
        </div>
        <div className="max-h-[360px] overflow-y-auto px-2 py-2">
          {results.length === 0 ? (
            <div className="px-3 py-6 text-sm text-[color:var(--muted)]">No matches found.</div>
          ) : (
            <ul className="space-y-1">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                      "hover:bg-[var(--hover)]"
                    )}
                  >
                    <div>
                      <div className="text-[color:var(--text)]">{result.label}</div>
                      {result.type !== "nav" ? (
                        <div className="text-xs text-[color:var(--muted)]">{result.description}</div>
                      ) : null}
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      {result.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
