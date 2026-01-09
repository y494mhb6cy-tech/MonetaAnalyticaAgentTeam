"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDemoData } from "../lib/demo-data";

const navItems = [
  { label: "Map", href: "/map" },
  { label: "Personnel", href: "/personnel" },
  { label: "Agents", href: "/agents" },
  { label: "Builder", href: "/builder/tasks" },
  { label: "Settings", href: "/settings" }
];

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [agents, setAgents] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const data = getDemoData();
    setPeople(data.personnel.map((person) => person.name));
    setAgents(data.agents.map((agent) => agent.name));
  }, [open]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    const handleOpen = () => setOpen(true);
    window.addEventListener("maos:command-palette", handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("maos:command-palette", handleOpen);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const filteredNav = useMemo(() => {
    const search = query.toLowerCase();
    return navItems.filter((item) => item.label.toLowerCase().includes(search));
  }, [query]);

  const filteredPeople = useMemo(() => {
    const search = query.toLowerCase();
    return people.filter((name) => name.toLowerCase().includes(search)).slice(0, 6);
  }, [people, query]);

  const filteredAgents = useMemo(() => {
    const search = query.toLowerCase();
    return agents.filter((name) => name.toLowerCase().includes(search)).slice(0, 6);
  }, [agents, query]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-16"
      onClick={close}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[var(--border)] px-4 py-3">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search personnel, agents, or jump to…"
            className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <div className="max-h-[360px] overflow-y-auto px-2 py-2 text-sm">
          <div className="px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Navigation</div>
          <div className="space-y-1">
            {filteredNav.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  if (pathname !== item.href) {
                    router.push(item.href);
                  }
                  close();
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[var(--text)] hover:bg-[var(--hover)]"
              >
                <span>{item.label}</span>
                <span className="text-xs text-[var(--muted)]">Go</span>
              </button>
            ))}
          </div>

          <div className="mt-3 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Personnel</div>
          <div className="space-y-1">
            {filteredPeople.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--muted)]">No matches</div>
            ) : (
              filteredPeople.map((name) => (
                <div key={name} className="rounded-md px-3 py-2 text-[var(--text)] hover:bg-[var(--hover)]">
                  {name}
                </div>
              ))
            )}
          </div>

          <div className="mt-3 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Agents</div>
          <div className="space-y-1">
            {filteredAgents.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--muted)]">No matches</div>
            ) : (
              filteredAgents.map((name) => (
                <div key={name} className="rounded-md px-3 py-2 text-[var(--text)] hover:bg-[var(--hover)]">
                  {name}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
