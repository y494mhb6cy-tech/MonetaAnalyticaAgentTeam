"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Agent } from "../../lib/maos-types";
import { useMaosStore } from "../../lib/maos-store";
import { generateAgentDependencies, getAgentHealth, getAgentCriticality, getConnectedAgents, type AgentDependency } from "../../lib/agent-dependencies";
import { FilterChip, FilterSection, FilterPresetButton } from "../../components/FilterChip";
import { Badge, Button } from "../../components/ui";
import { Layers, AlertTriangle, Activity } from "lucide-react";

// Dynamic import for canvas component to avoid SSR issues
const AgentsTopologyCanvas = dynamic(() => import("../../components/AgentsTopologyCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading topology...</span>
      </div>
    </div>
  ),
});

function AgentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { agents, addRecentEntity, setAiContext, setAiPanelOpen, tasks } = useMaosStore();

  // Canvas size management
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [utilBand, setUtilBand] = useState<string | null>(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Selection state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [focusedModule, setFocusedModule] = useState<string | null>(null);

  // Hover state for tooltip
  const [hoveredAgent, setHoveredAgent] = useState<{
    agent: Agent;
    x: number;
    y: number;
  } | null>(null);

  // Sidebar toggle for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Generate dependencies
  const dependencies = useMemo(() => generateAgentDependencies(agents), [agents]);

  // Compute available filter options
  const modules = useMemo(() => Array.from(new Set(agents.map((a) => a.module))), [agents]);
  const teams = useMemo(() => Array.from(new Set(agents.map((a) => a.ownerTeam))), [agents]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return agents.filter((agent) => {
      // Search filter
      const matchesSearch =
        !normalized ||
        agent.name.toLowerCase().includes(normalized) ||
        agent.purpose.toLowerCase().includes(normalized) ||
        agent.module.toLowerCase().includes(normalized);

      // Module filter
      const matchesModule = selectedModules.length === 0 || selectedModules.includes(agent.module);

      // Status filter
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(agent.status);

      // Team filter
      const matchesTeam = selectedTeams.length === 0 || selectedTeams.includes(agent.ownerTeam);

      // Utilization band filter
      let matchesUtil = true;
      if (utilBand === "low") matchesUtil = agent.utilization < 30;
      else if (utilBand === "mid") matchesUtil = agent.utilization >= 30 && agent.utilization <= 70;
      else if (utilBand === "high") matchesUtil = agent.utilization > 70;

      // Critical filter
      const matchesCritical = !showCriticalOnly || getAgentHealth(agent) === "Critical";

      return matchesSearch && matchesModule && matchesStatus && matchesTeam && matchesUtil && matchesCritical;
    });
  }, [agents, search, selectedModules, selectedStatuses, selectedTeams, utilBand, showCriticalOnly]);

  const selectedAgent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) ?? null : null;

  // Get connected agents
  const connectedAgents = useMemo(() => {
    if (!selectedAgent) return { upstream: [], downstream: [] };
    return getConnectedAgents(selectedAgent.id, dependencies, agents);
  }, [selectedAgent, dependencies, agents]);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();

    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle URL params
  useEffect(() => {
    const selectParam = searchParams.get("select");
    if (selectParam) {
      setSelectedAgentId(selectParam);
      setDetailsOpen(true);
    }
  }, [searchParams]);

  // Add to recent entities when selected
  useEffect(() => {
    if (selectedAgent) {
      addRecentEntity({
        id: selectedAgent.id,
        kind: "agent",
        name: selectedAgent.name,
        subtitle: selectedAgent.module,
      });
    }
  }, [selectedAgent, addRecentEntity]);

  // ESC key to close details panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedAgentId) {
        setSelectedAgentId(null);
        setDetailsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedAgentId]);

  // Handlers
  const handleSelectAgent = useCallback((agent: Agent | null) => {
    setSelectedAgentId(agent?.id ?? null);
    setDetailsOpen(!!agent);
  }, []);

  const handleHoverAgent = useCallback((agent: Agent | null, x: number, y: number) => {
    if (agent) {
      setHoveredAgent({ agent, x, y });
    } else {
      setHoveredAgent(null);
    }
  }, []);

  const handleViewMap = useCallback(() => {
    if (selectedAgent) {
      router.push(`/map?focus=agent:${selectedAgent.id}`);
    }
  }, [selectedAgent, router]);

  const handleAskAI = useCallback(() => {
    if (selectedAgent) {
      setAiContext({ kind: "agent", id: selectedAgent.id });
      setAiPanelOpen(true);
    }
  }, [selectedAgent, setAiContext, setAiPanelOpen]);

  const clearFilters = useCallback(() => {
    setSelectedModules([]);
    setSelectedStatuses([]);
    setSelectedTeams([]);
    setUtilBand(null);
    setShowCriticalOnly(false);
  }, []);

  const hasActiveFilters =
    selectedModules.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedTeams.length > 0 ||
    utilBand !== null ||
    showCriticalOnly;

  // Rollup stats
  const healthCounts = useMemo(() => {
    const counts = { Healthy: 0, Warning: 0, Critical: 0 };
    filteredAgents.forEach((agent) => {
      counts[getAgentHealth(agent)]++;
    });
    return counts;
  }, [filteredAgents]);

  const avgUtilization = useMemo(() => {
    if (filteredAgents.length === 0) return 0;
    return Math.round(filteredAgents.reduce((sum, a) => sum + a.utilization, 0) / filteredAgents.length);
  }, [filteredAgents]);

  return (
    <div className="h-[calc(100vh-52px)] w-full flex bg-slate-950 overflow-hidden pb-16 md:pb-0">
      {/* Left sidebar: Filters - collapsible on mobile */}
      <div
        className={`${
          sidebarOpen ? "w-full md:w-80 absolute md:relative z-40 h-full" : "w-0"
        } transition-all duration-200 border-r border-slate-800 bg-slate-900 overflow-hidden flex flex-col`}
      >
        <div className="flex-none px-5 py-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Agents</div>
              <div className="text-lg font-semibold text-white">Operating Surface</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </div>

          {/* Quick presets */}
          <FilterSection title="Quick filters">
            <div className="grid grid-cols-2 gap-2">
              <FilterPresetButton
                label="Critical"
                onClick={() => setShowCriticalOnly(!showCriticalOnly)}
                active={showCriticalOnly}
              />
              <FilterPresetButton
                label="Overloaded"
                onClick={() => setUtilBand(utilBand === "high" ? null : "high")}
                active={utilBand === "high"}
              />
            </div>
          </FilterSection>

          {/* Active filters */}
          {hasActiveFilters && (
            <FilterSection title="Active filters">
              <div className="flex flex-wrap gap-2">
                {selectedModules.map((mod) => (
                  <FilterChip
                    key={mod}
                    label={mod}
                    onRemove={() => setSelectedModules((prev) => prev.filter((m) => m !== mod))}
                  />
                ))}
                {selectedStatuses.map((status) => (
                  <FilterChip
                    key={status}
                    label={status}
                    onRemove={() => setSelectedStatuses((prev) => prev.filter((s) => s !== status))}
                  />
                ))}
                {selectedTeams.map((team) => (
                  <FilterChip
                    key={team}
                    label={team}
                    onRemove={() => setSelectedTeams((prev) => prev.filter((t) => t !== team))}
                  />
                ))}
                {utilBand && (
                  <FilterChip
                    label={`${utilBand} utilization`}
                    onRemove={() => setUtilBand(null)}
                  />
                )}
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Clear all
                </button>
              </div>
            </FilterSection>
          )}

          {/* Module filter */}
          <FilterSection title="Module">
            <div className="flex flex-wrap gap-2">
              {modules.map((mod) => (
                <FilterChip
                  key={mod}
                  label={mod}
                  active={selectedModules.includes(mod)}
                  onClick={() =>
                    setSelectedModules((prev) =>
                      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
                    )
                  }
                />
              ))}
            </div>
          </FilterSection>

          {/* Team filter */}
          <FilterSection title="Owner team">
            <div className="flex flex-wrap gap-2">
              {teams.map((team) => (
                <FilterChip
                  key={team}
                  label={team}
                  active={selectedTeams.includes(team)}
                  onClick={() =>
                    setSelectedTeams((prev) =>
                      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
                    )
                  }
                />
              ))}
            </div>
          </FilterSection>

          {/* Status filter */}
          <FilterSection title="Status">
            <div className="flex flex-wrap gap-2">
              {["Running", "Idle", "Paused"].map((status) => (
                <FilterChip
                  key={status}
                  label={status}
                  active={selectedStatuses.includes(status)}
                  onClick={() =>
                    setSelectedStatuses((prev) =>
                      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
                    )
                  }
                />
              ))}
            </div>
          </FilterSection>

          {/* Utilization bands */}
          <FilterSection title="Utilization">
            <div className="grid grid-cols-3 gap-2">
              <FilterPresetButton
                label="0-30%"
                onClick={() => setUtilBand(utilBand === "low" ? null : "low")}
                active={utilBand === "low"}
              />
              <FilterPresetButton
                label="30-70%"
                onClick={() => setUtilBand(utilBand === "mid" ? null : "mid")}
                active={utilBand === "mid"}
              />
              <FilterPresetButton
                label="70-100%"
                onClick={() => setUtilBand(utilBand === "high" ? null : "high")}
                active={utilBand === "high"}
              />
            </div>
          </FilterSection>

          {/* Health rollup */}
          <FilterSection title="Health summary">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Healthy</span>
                <span className="font-semibold text-green-400">{healthCounts.Healthy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Warning</span>
                <span className="font-semibold text-amber-400">{healthCounts.Warning}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Critical</span>
                <span className="font-semibold text-red-400">{healthCounts.Critical}</span>
              </div>
            </div>
          </FilterSection>
        </div>
      </div>

      {/* Center: Topology Canvas */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0">
          <AgentsTopologyCanvas
            agents={filteredAgents}
            dependencies={dependencies}
            width={dimensions.width}
            height={dimensions.height}
            selectedAgentId={selectedAgentId}
            focusedModule={focusedModule}
            onSelectAgent={handleSelectAgent}
            onHoverAgent={handleHoverAgent}
          />
        </div>

        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-20 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2 text-slate-400 hover:text-white transition"
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Legend (bottom-left) */}
        <div className="absolute bottom-4 left-4 z-20">
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 px-4 py-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Legend</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-300">Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-300">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-300">Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats summary (top-right) */}
        <div className="absolute top-4 right-4 z-20">
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 px-4 py-3">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{filteredAgents.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Agents</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{modules.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Modules</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{avgUtilization}%</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Avg Util</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredAgent && !selectedAgent && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{ left: hoveredAgent.x + 10, top: hoveredAgent.y + 10 }}
          >
            <div className="rounded-lg bg-slate-900/95 backdrop-blur-sm border border-slate-700 px-3 py-2 shadow-xl max-w-xs">
              <div className="text-sm font-semibold text-white">{hoveredAgent.agent.name}</div>
              <div className="text-xs text-slate-400">{hoveredAgent.agent.module}</div>
              <div className="mt-1 text-xs text-slate-300">{hoveredAgent.agent.purpose}</div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  Util: <span className="text-white font-semibold">{hoveredAgent.agent.utilization}%</span>
                </span>
                <span className="text-slate-400">
                  Success: <span className="text-white font-semibold">{hoveredAgent.agent.metrics.successRate}%</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint (bottom-right) */}
        <div className="absolute bottom-4 right-4 z-20 hidden md:block">
          <div className="text-[10px] text-slate-600 space-y-0.5">
            <div>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 mr-1">Scroll</kbd>
              Zoom
            </div>
            <div>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 mr-1">Drag</kbd>
              Pan
            </div>
            <div>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 mr-1">Click</kbd>
              Select
            </div>
          </div>
        </div>
      </div>

      {/* Right details panel - full screen on mobile */}
      {detailsOpen && selectedAgent && (
        <div className="w-full md:w-96 absolute md:relative right-0 h-full z-50 border-l border-slate-800 bg-slate-900 overflow-y-auto flex flex-col">
          <div className="flex-none px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Agent Details</div>
              <div className="text-lg font-semibold text-white">{selectedAgent.name}</div>
            </div>
            <button
              onClick={() => setDetailsOpen(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              Close
            </button>
          </div>

          <div className="flex-1 px-5 py-4 space-y-5">
            {/* Summary */}
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Summary</div>
              <div className="text-sm text-slate-300">{selectedAgent.purpose}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge label={selectedAgent.module} />
                <Badge label={selectedAgent.ownerTeam} />
                <Badge label={selectedAgent.status} />
                <Badge label={getAgentHealth(selectedAgent)} />
              </div>
            </div>

            {/* Metrics */}
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Metrics</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-400">Runs (today)</div>
                  <div className="text-lg font-semibold text-white">{selectedAgent.metrics.runsToday}</div>
                </div>
                <div>
                  <div className="text-slate-400">Runs (week)</div>
                  <div className="text-lg font-semibold text-white">{selectedAgent.metrics.runsWeek}</div>
                </div>
                <div>
                  <div className="text-slate-400">Success rate</div>
                  <div className="text-lg font-semibold text-green-400">{selectedAgent.metrics.successRate}%</div>
                </div>
                <div>
                  <div className="text-slate-400">Error rate</div>
                  <div className="text-lg font-semibold text-red-400">{selectedAgent.metrics.errorRate}%</div>
                </div>
                <div>
                  <div className="text-slate-400">Avg latency</div>
                  <div className="text-lg font-semibold text-white">{selectedAgent.metrics.avgLatencyMs}ms</div>
                </div>
                <div>
                  <div className="text-slate-400">Utilization</div>
                  <div className="text-lg font-semibold text-blue-400">{selectedAgent.utilization}%</div>
                </div>
              </div>
            </div>

            {/* Task queue */}
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Task Queue</div>
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.ownerType === "agent" && t.ownerId === selectedAgent.id)
                  .slice(0, 5)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                    >
                      <div className="font-medium text-white">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge label={task.status} />
                        <Badge label={task.priority} />
                      </div>
                    </div>
                  ))}
                {tasks.filter((t) => t.ownerType === "agent" && t.ownerId === selectedAgent.id).length === 0 && (
                  <div className="text-sm text-slate-500">No open tasks</div>
                )}
              </div>
            </div>

            {/* Connections */}
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Connections</div>
              <div className="space-y-3">
                {connectedAgents.upstream.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Upstream</div>
                    <div className="space-y-1">
                      {connectedAgents.upstream.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => setSelectedAgentId(agent.id)}
                          className="w-full text-left text-sm text-blue-400 hover:text-blue-300"
                        >
                          → {agent.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {connectedAgents.downstream.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Downstream</div>
                    <div className="space-y-1">
                      {connectedAgents.downstream.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => setSelectedAgentId(agent.id)}
                          className="w-full text-left text-sm text-blue-400 hover:text-blue-300"
                        >
                          ← {agent.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {connectedAgents.upstream.length === 0 && connectedAgents.downstream.length === 0 && (
                  <div className="text-sm text-slate-500">No connections</div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Quick Actions</div>
              <div className="space-y-2">
                <Button onClick={handleAskAI} className="w-full" variant="ghost">
                  <Activity className="w-4 h-4 mr-2" />
                  AI Preview
                </Button>
                <Button onClick={handleViewMap} className="w-full" variant="ghost">
                  View in Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400">Loading agents…</div>}>
      <AgentsContent />
    </Suspense>
  );
}
