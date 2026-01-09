"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Badge, Card, Input, PageHeader } from "../../components/ui";
import { AgentProfile, getDemoData } from "../../lib/demo-data";

export default function AgentsPage() {
  const [data, setData] = useState<AgentProfile[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const demo = getDemoData();
    setData(demo.agents);
    setSelectedId(demo.agents[0]?.id ?? null);
  }, []);

  const modules = useMemo(() => {
    const set = new Set(data.map((agent) => agent.module));
    return ["All", ...Array.from(set)];
  }, [data]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return data.filter((agent) => {
      const matchesSearch =
        !normalized ||
        agent.name.toLowerCase().includes(normalized) ||
        agent.purpose.toLowerCase().includes(normalized);
      const matchesModule = moduleFilter === "All" || agent.module === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [data, moduleFilter, search]);

  const selected = data.find((agent) => agent.id === selectedId) ?? filtered[0];

  useEffect(() => {
    if (filtered.length > 0 && !selectedId) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  return (
    <div className="space-y-6">
      <PageHeader title="Agents" subtitle="Monitor automation coverage, utilization, and health." />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr_320px]">
        <Card className="space-y-4">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Directory filters</div>
          <Input
            label="Search"
            placeholder="Search agents or purpose"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Modules</div>
            <div className="mt-2 space-y-2">
              {modules.map((module) => (
                <button
                  key={module}
                  type="button"
                  onClick={() => setModuleFilter(module)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm",
                    moduleFilter === module
                      ? "border-[var(--accent)] bg-[var(--selection)] text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--hover)]"
                  )}
                >
                  {module}
                  <span className="text-xs">
                    {data.filter((agent) => module === "All" || agent.module === module).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Agents</div>
              <div className="text-sm text-[var(--muted)]">{filtered.length} active agents</div>
            </div>
            <Badge label="Monitoring" />
          </div>
          <div className="space-y-2">
            {filtered.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedId(agent.id)}
                className={clsx(
                  "w-full rounded-md border px-3 py-2 text-left",
                  selected?.id === agent.id
                    ? "border-[var(--accent)] bg-[var(--selection)]"
                    : "border-[var(--border)] bg-[var(--panel2)] hover:bg-[var(--hover)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-[var(--text)]">{agent.name}</div>
                  <span className="text-xs text-[var(--muted)]">{agent.module}</span>
                </div>
                <div className="mt-1 text-xs text-[var(--muted)]">{agent.purpose}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase text-[var(--muted)]">
                  <span>{agent.health}</span>
                  <span>·</span>
                  <span>{(agent.successRate * 100).toFixed(1)}% success</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Detail</div>
            {selected ? (
              <div className="mt-2">
                <div className="text-lg font-semibold text-[var(--text)]">{selected.name}</div>
                <div className="text-xs text-[var(--muted)]">{selected.module} · {selected.ownerTeam}</div>
              </div>
            ) : null}
          </div>
          {selected ? (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge label={selected.health} />
                <Badge label={`${(selected.successRate * 100).toFixed(1)}% success`} className="bg-sky-500/10 text-sky-200" />
              </div>
              <div className="text-xs text-[var(--muted)]">{selected.purpose}</div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Inputs</div>
                <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                  {selected.inputs.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Outputs</div>
                <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                  {selected.outputs.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                <div>
                  Runs today: <span className="text-[var(--text)]">{selected.runsToday}</span>
                </div>
                <div>
                  Runs week: <span className="text-[var(--text)]">{selected.runsWeek}</span>
                </div>
                <div>
                  Latency: <span className="text-[var(--text)]">{selected.avgLatencyMs}ms</span>
                </div>
                <div>
                  Error rate: <span className="text-[var(--text)]">{selected.errorRate.toFixed(2)}%</span>
                </div>
                <div>
                  Last run: <span className="text-[var(--text)]">{new Date(selected.lastRunAt).toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-[var(--muted)]">Select an agent to view details.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
