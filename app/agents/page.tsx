"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentDetailPanel } from "../../components/MaosDetailPanel";
import { Badge, Button, Card, Input, PageHeader, Select } from "../../components/ui";
import { SectionLayout } from "../../components/SectionLayout";
import { RecentEntities } from "../../components/RecentEntities";
import { Agent, AgentStatus } from "../../lib/maos-types";
import { useMaosStore } from "../../lib/maos-store";

const statusOptions: AgentStatus[] = ["Running", "Idle", "Paused"];

function AgentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { agents, addAgent, addRecentEntity } = useMaosStore();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [utilMin, setUtilMin] = useState(0);
  const [utilMax, setUtilMax] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(agents[0]?.id ?? null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const modules = useMemo(() => Array.from(new Set(agents.map((agent) => agent.module))), [agents]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return agents.filter((agent) => {
      const matchesSearch =
        !normalized ||
        agent.name.toLowerCase().includes(normalized) ||
        agent.purpose.toLowerCase().includes(normalized);
      const matchesModule = moduleFilter === "all" || agent.module === moduleFilter;
      const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
      const matchesUtil = agent.utilization >= utilMin && agent.utilization <= utilMax;
      return matchesSearch && matchesModule && matchesStatus && matchesUtil;
    });
  }, [agents, moduleFilter, search, statusFilter, utilMax, utilMin]);

  const selected = selectedId ? agents.find((agent) => agent.id === selectedId) ?? null : null;

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const selectedParam = searchParams.get("select");
    if (selectedParam) {
      setSelectedId(selectedParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedId && !agents.find((agent) => agent.id === selectedId)) {
      setSelectedId(agents[0]?.id ?? null);
    }
  }, [agents, selectedId]);

  useEffect(() => {
    if (selected) {
      addRecentEntity({
        id: selected.id,
        kind: "agent",
        name: selected.name,
        subtitle: selected.module
      });
    }
  }, [addRecentEntity, selected]);

  const handleAdd = () => {
    const next = addAgent();
    setSelectedId(next.id);
  };

  const handleViewMap = (agent: Agent) => {
    router.push(`/map?focus=agent:${agent.id}`);
  };

  return (
    <SectionLayout
      sidebar={
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Agents</div>
            <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">Module filters</div>
          </div>
          <Input
            ref={searchRef}
            label="Search"
            placeholder="Search by name or purpose"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select label="Module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
            <option value="all">All modules</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </Select>
          <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Utilization min"
              type="number"
              min={0}
              max={100}
              value={utilMin}
              onChange={(event) => setUtilMin(Number(event.target.value))}
            />
            <Input
              label="Utilization max"
              type="number"
              min={0}
              max={100}
              value={utilMax}
              onChange={(event) => setUtilMax(Number(event.target.value))}
            />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Modules</div>
            <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
              {modules.map((module) => (
                <button
                  key={module}
                  type="button"
                  className={moduleFilter === module ? "text-[color:var(--text)]" : "hover:text-[color:var(--text)]"}
                  onClick={() => setModuleFilter(module)}
                >
                  {module}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      detail={
        <div className="space-y-4">
          {selected ? (
            <AgentDetailPanel agent={selected} showViewOnMap onViewMap={() => handleViewMap(selected)} />
          ) : (
            <Card className="flex items-center justify-center text-sm text-[color:var(--muted)]">
              Select an agent to view details.
            </Card>
          )}
          <RecentEntities onSelect={(entity) => setSelectedId(entity.id)} />
        </div>
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Agents"
          subtitle="Autonomous modules orchestrating MAOS (Moneta Analytica Agent Team)."
          actions={<Button onClick={handleAdd}>Add new</Button>}
        />

        <Card className="p-0">
          <div className="border-b border-[color:var(--border)] px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Active agents</div>
                <div className="text-lg font-semibold text-[color:var(--text)]">{filtered.length} modules</div>
              </div>
              <Badge label="Automation directory" />
            </div>
          </div>
          <div className="divide-y divide-[color:var(--border)]">
            {filtered.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedId(agent.id)}
                className={`w-full px-5 py-4 text-left transition hover:bg-[var(--hover)] ${
                  selectedId === agent.id ? "bg-[var(--hover)]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--text)]">{agent.name}</div>
                    <div className="text-xs text-[color:var(--muted)]">{agent.purpose}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={agent.module} />
                    <Badge label={agent.status} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[color:var(--muted)] md:grid-cols-4">
                  <div>
                    <div className="text-[color:var(--muted)]">Runs (today)</div>
                    <div className="text-sm text-[color:var(--text)]">{agent.metrics.runsToday}</div>
                  </div>
                  <div>
                    <div className="text-[color:var(--muted)]">Runs (week)</div>
                    <div className="text-sm text-[color:var(--text)]">{agent.metrics.runsWeek}</div>
                  </div>
                  <div>
                    <div className="text-[color:var(--muted)]">Success rate</div>
                    <div className="text-sm text-[color:var(--text)]">{agent.metrics.successRate}%</div>
                  </div>
                  <div className="flex items-center justify-end md:justify-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleViewMap(agent);
                      }}
                    >
                      View on map
                    </Button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </SectionLayout>
  );
}

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="text-[color:var(--muted)]">Loading agents…</div>}>
      <AgentsContent />
    </Suspense>
  );
}
