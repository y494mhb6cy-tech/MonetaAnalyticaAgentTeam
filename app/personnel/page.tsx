"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Badge, Card, Input, PageHeader } from "../../components/ui";
import { PersonnelProfile, Team, getDemoData } from "../../lib/demo-data";

const teamLabels: Team[] = ["Sales", "Ops", "Finance", "HR", "Exec"];

export default function PersonnelPage() {
  const [data, setData] = useState<PersonnelProfile[]>([]);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<Team | "All">("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const demo = getDemoData();
    setData(demo.personnel);
    setSelectedId(demo.personnel[0]?.id ?? null);
  }, []);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return data.filter((person) => {
      const matchesSearch =
        !normalized ||
        person.name.toLowerCase().includes(normalized) ||
        person.title.toLowerCase().includes(normalized);
      const matchesTeam = teamFilter === "All" || person.team === teamFilter;
      const matchesStatus = statusFilter === "All" || person.status === statusFilter;
      return matchesSearch && matchesTeam && matchesStatus;
    });
  }, [data, search, statusFilter, teamFilter]);

  const selected = data.find((person) => person.id === selectedId) ?? filtered[0];

  useEffect(() => {
    if (filtered.length > 0 && !selectedId) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const statusOptions = useMemo(() => {
    const set = new Set(data.map((person) => person.status));
    return ["All", ...Array.from(set)];
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader title="Personnel" subtitle="Track capacity, accountability, and KPI performance across teams." />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr_320px]">
        <Card className="space-y-4">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Directory filters</div>
          <Input
            label="Search"
            placeholder="Search name or title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Teams</div>
            <div className="mt-2 space-y-2">
              {["All", ...teamLabels].map((team) => (
                <button
                  key={team}
                  type="button"
                  onClick={() => setTeamFilter(team as Team | "All")}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm",
                    teamFilter === team
                      ? "border-[var(--accent)] bg-[var(--selection)] text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--hover)]"
                  )}
                >
                  {team}
                  <span className="text-xs">
                    {data.filter((person) => team === "All" || person.team === team).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Status</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    "rounded-full border px-3 py-1 text-xs",
                    statusFilter === status
                      ? "border-[var(--accent)] bg-[var(--selection)] text-[var(--text)]"
                      : "border-[var(--border)] text-[var(--muted)]"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Personnel</div>
              <div className="text-sm text-[var(--muted)]">{filtered.length} people</div>
            </div>
            <Badge label="Active roster" />
          </div>
          <div className="space-y-2">
            {filtered.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setSelectedId(person.id)}
                className={clsx(
                  "w-full rounded-md border px-3 py-2 text-left",
                  selected?.id === person.id
                    ? "border-[var(--accent)] bg-[var(--selection)]"
                    : "border-[var(--border)] bg-[var(--panel2)] hover:bg-[var(--hover)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-[var(--text)]">{person.name}</div>
                  <span className="text-xs text-[var(--muted)]">{person.team}</span>
                </div>
                <div className="mt-1 text-xs text-[var(--muted)]">{person.title}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase text-[var(--muted)]">
                  <span>{person.status}</span>
                  <span>·</span>
                  <span>{person.capacity}</span>
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
                <div className="text-xs text-[var(--muted)]">
                  {selected.title} · {selected.level} · {selected.team}
                </div>
              </div>
            ) : null}
          </div>
          {selected ? (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge label={selected.status} />
                <Badge label={selected.capacity} className="bg-emerald-500/10 text-emerald-200" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Responsibilities</div>
                <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                  {selected.responsibilities.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">RACI Tasks</div>
                <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                  {selected.tasks.map((task) => (
                    <li key={task.task}>
                      <span className="font-semibold text-[var(--text)]">{task.role}</span> {task.task}
                      {task.partner ? <span className="text-[var(--muted)]"> · {task.partner}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
              {selected.metrics.callsWeek !== undefined ? (
                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                  <div>
                    Calls today: <span className="text-[var(--text)]">{selected.metrics.callsToday}</span>
                  </div>
                  <div>
                    Calls week: <span className="text-[var(--text)]">{selected.metrics.callsWeek}</span>
                  </div>
                  <div>
                    Sales today: <span className="text-[var(--text)]">{selected.metrics.salesToday}</span>
                  </div>
                  <div>
                    Sales week: <span className="text-[var(--text)]">{selected.metrics.salesWeek}</span>
                  </div>
                  <div>
                    Revenue week: <span className="text-[var(--text)]">${selected.metrics.revenueWeek?.toLocaleString()}</span>
                  </div>
                </div>
              ) : null}
              {selected.metrics.jobsScheduledToday !== undefined ? (
                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                  <div>
                    Jobs scheduled: <span className="text-[var(--text)]">{selected.metrics.jobsScheduledToday}</span>
                  </div>
                  <div>
                    Jobs completed: <span className="text-[var(--text)]">{selected.metrics.jobsCompletedToday}</span>
                  </div>
                  <div>
                    Backlog: <span className="text-[var(--text)]">{selected.metrics.backlog}</span>
                  </div>
                  <div>
                    Overtime hrs: <span className="text-[var(--text)]">{selected.metrics.overtimeHoursWeek}</span>
                  </div>
                </div>
              ) : null}
              {selected.metrics.invoicesProcessedToday !== undefined ? (
                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                  <div>
                    Invoices today: <span className="text-[var(--text)]">{selected.metrics.invoicesProcessedToday}</span>
                  </div>
                  <div>
                    AR calls week: <span className="text-[var(--text)]">{selected.metrics.arCallsWeek}</span>
                  </div>
                  <div>
                    Close tasks open: <span className="text-[var(--text)]">{selected.metrics.closeTasksOpen}</span>
                  </div>
                  <div>
                    Days to close: <span className="text-[var(--text)]">{selected.metrics.daysToCloseEstimate}</span>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-xs text-[var(--muted)]">Select a person to view details.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
