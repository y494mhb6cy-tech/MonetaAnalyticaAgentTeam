"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentDetailPanel } from "../../components/MaosDetailPanel";
import { Badge, Button, Card, Input, PageHeader, Select } from "../../components/ui";
import { Agent, AgentStatus } from "../../lib/maos-types";
import { useMaosStore } from "../../lib/maos-store";

const statusOptions: AgentStatus[] = ["Running", "Idle", "Paused"];

export default function AgentsPage() {
  const router = useRouter();
  const { agents, addAgent } = useMaosStore();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [utilMin, setUtilMin] = useState(0);
  const [utilMax, setUtilMax] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(agents[0]?.id ?? null);

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

  const handleAdd = () => {
    const next = addAgent();
    setSelectedId(next.id);
  };

  const handleViewMap = (agent: Agent) => {
    router.push(`/map?focus=agent:${agent.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        subtitle="Autonomous modules orchestrating Moneta Analytica OS."
        actions={
          <Button onClick={handleAdd}>Add new</Button>
        }
      />

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <Input label="Search" placeholder="Search by name or purpose" value={search} onChange={(event) => setSearch(event.target.value)} />
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
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-0">
          <div className="border-b border-white/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Active Agents</div>
                <div className="text-lg font-semibold text-white">{filtered.length} modules</div>
              </div>
              <Badge label="Automation directory" />
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedId(agent.id)}
                className={`w-full px-6 py-4 text-left transition hover:bg-white/5 ${
                  selectedId === agent.id ? "bg-white/5" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-white">{agent.name}</div>
                    <div className="text-sm text-slate-300">{agent.purpose}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={agent.module} />
                    <Badge label={agent.status} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-slate-400 md:grid-cols-4">
                  <div>
                    <div className="text-slate-500">Runs (today)</div>
                    <div className="text-sm text-white">{agent.metrics.runsToday}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Runs (week)</div>
                    <div className="text-sm text-white">{agent.metrics.runsWeek}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Success rate</div>
                    <div className="text-sm text-white">{agent.metrics.successRate}%</div>
                  </div>
                  <div className="flex items-center justify-end md:justify-start">
                    <Button
                      variant="ghost"
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

        {selected ? (
          <div className="lg:sticky lg:top-24">
            <AgentDetailPanel agent={selected} showViewOnMap onViewMap={() => handleViewMap(selected)} />
          </div>
        ) : (
          <Card className="flex items-center justify-center text-sm text-slate-400">
            Select an agent to view details.
          </Card>
        )}
      </div>
    </div>
  );
}
