"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  mockAgentDepartments,
  mockAgentModules,
  mockAgentNodes,
  mockAgentDependencies,
  filterModules,
  getAgentsByModule,
  type AgentModule,
  type AgentNode,
  type AgentStatus,
  type AgentCriticality,
} from "@/lib/mockData";
import {
  Search,
  X,
  Activity,
  Layers,
  Cpu,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ViewToggle } from "@/components/ViewToggle";
import { BuildVersion } from "@/components/BuildVersion";
import AgentLegend from "@/components/AgentLegend";
import clsx from "clsx";

// Dynamic import for graph component to avoid SSR issues
const AgentArchitectureGraph = dynamic(
  () => import("@/components/AgentArchitectureGraph").then((mod) => mod.AgentArchitectureGraph),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading agents graph...</span>
        </div>
      </div>
    ),
  }
);

export default function AgentArchitecturePage() {
  // Canvas size management
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<AgentStatus | "">("");
  const [selectedCriticality, setSelectedCriticality] = useState<AgentCriticality | "">("");

  // Selection state
  const [selectedNode, setSelectedNode] = useState<AgentModule | AgentNode | null>(null);

  // Panel state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  // Filter modules and agents based on criteria
  const filteredModules = useMemo(() => {
    return filterModules({
      search: searchQuery,
      departmentId: selectedDepartment || undefined,
      status: selectedStatus || undefined,
      criticality: selectedCriticality || undefined,
    });
  }, [searchQuery, selectedDepartment, selectedStatus, selectedCriticality]);

  const filteredAgents = useMemo(() => {
    const moduleIds = new Set(filteredModules.map((m) => m.id));
    return mockAgentNodes.filter((a) => moduleIds.has(a.moduleId));
  }, [filteredModules]);

  const filteredDependencies = useMemo(() => {
    const nodeIds = new Set([
      ...filteredModules.map((m) => m.id),
      ...filteredAgents.map((a) => a.id),
    ]);
    return mockAgentDependencies.filter(
      (d) => nodeIds.has(d.fromId) && nodeIds.has(d.toId)
    );
  }, [filteredModules, filteredAgents]);

  // Metrics for the summary panel
  const metrics = useMemo(() => {
    const healthyCount = mockAgentNodes.filter((a) => a.status === "healthy").length;
    const warningCount = mockAgentNodes.filter((a) => a.status === "warning" || a.status === "critical").length;
    return {
      total: mockAgentNodes.length,
      healthy: healthyCount,
      issues: warningCount,
      modules: mockAgentModules.length,
    };
  }, []);

  const handleModuleClick = useCallback((module: AgentModule) => {
    setSelectedNode(module);
  }, []);

  const handleAgentClick = useCallback((agent: AgentNode) => {
    setSelectedNode(agent);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedDepartment("");
    setSelectedStatus("");
    setSelectedCriticality("");
  }, []);

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "critical":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "offline":
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const hasActiveFilters = searchQuery || selectedDepartment || selectedStatus || selectedCriticality;

  return (
    <div className="h-[calc(100vh-52px)] w-full flex flex-col bg-slate-950 overflow-hidden pb-16 md:pb-0">
      {/* Map region (full height) */}
      <div className="flex-1 min-h-0 relative">
        <div ref={containerRef} className="absolute inset-0">
          {filteredModules.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Layers className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No modules found
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  No modules match your current filter criteria. Try adjusting your filters or clearing them to see all modules.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-sm text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <AgentArchitectureGraph
              departments={mockAgentDepartments}
              modules={filteredModules}
              agents={filteredAgents}
              dependencies={filteredDependencies}
              onModuleClick={handleModuleClick}
              onAgentClick={handleAgentClick}
            />
          )}
        </div>

        {/* Control bar (top-left) - matches /map layout */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* View Toggle */}
          <ViewToggle />

          {/* Filter Controls */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 p-2 backdrop-blur-sm border border-slate-700/50">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all",
                showFilters
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          </div>

          {/* Results count */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 p-2 backdrop-blur-sm border border-slate-700/50">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-white font-medium">{filteredModules.length}</span>
                <span className="text-slate-500">modules</span>
              </div>
              <div className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-white font-medium">{filteredAgents.length}</span>
                <span className="text-slate-500">agents</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced filter controls (top-left, below control bar) - hidden on mobile by default */}
        {showFilters && (
          <div className={clsx(
            "absolute top-36 left-4 z-20 space-y-2",
            mobileControlsOpen ? "block" : "hidden md:block"
          )}>
            {/* Search */}
            <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1 flex items-center gap-1">
                <Search className="w-3 h-3" />
                Search
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search modules or agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Department filter */}
            <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1">
                Department
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-48 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Departments</option>
                {mockAgentDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1">
                Status
              </div>
              <div className="flex gap-1 flex-wrap">
                {(["", "healthy", "warning", "critical", "offline"] as const).map((status) => (
                  <button
                    key={status || "all"}
                    onClick={() => setSelectedStatus(status)}
                    className={clsx(
                      "px-2 py-1 text-xs rounded transition-colors",
                      selectedStatus === status
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                  >
                    {status === "" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Criticality filter */}
            <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1">
                Criticality
              </div>
              <div className="flex gap-1 flex-wrap">
                {(["", "low", "medium", "high", "critical"] as const).map((crit) => (
                  <button
                    key={crit || "all"}
                    onClick={() => setSelectedCriticality(crit)}
                    className={clsx(
                      "px-2 py-1 text-xs rounded transition-colors",
                      selectedCriticality === crit
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                  >
                    {crit === "" ? "All" : crit.charAt(0).toUpperCase() + crit.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full px-3 py-2 text-xs text-indigo-400 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Legend (bottom-left) */}
        <AgentLegend />

        {/* Org metrics summary (top-right) - matches /map layout */}
        <div className="absolute top-4 right-4 z-20">
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 px-3 py-2 md:px-4 md:py-3">
            <div className="flex items-center gap-4 md:gap-6">
              {/* Total agents */}
              <div className="text-center">
                <div className="text-base md:text-lg font-bold text-white">
                  {metrics.total}
                </div>
                <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                  Agents
                </div>
              </div>

              {/* Healthy */}
              <div className="text-center">
                <div className="text-base md:text-lg font-bold text-green-400">
                  {metrics.healthy}
                </div>
                <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                  Healthy
                </div>
              </div>

              {/* Issues */}
              {metrics.issues > 0 && (
                <div className="text-center">
                  <div className="text-base md:text-lg font-bold text-amber-400">
                    {metrics.issues}
                  </div>
                  <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                    Issues
                  </div>
                </div>
              )}

              {/* Modules - hidden on mobile */}
              <div className="hidden md:block text-center">
                <div className="text-lg font-bold text-white">
                  {metrics.modules}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Modules
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts hint (bottom-right) - hidden on mobile */}
        <div className="absolute bottom-4 right-4 z-20 hidden md:block">
          <div className="text-[10px] text-slate-600 space-y-0.5">
            <div>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 mr-1">
                Scroll
              </kbd>
              Zoom
            </div>
            <div>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 mr-1">
                Drag
              </kbd>
              Pan
            </div>
            <div>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 mr-1">
                Click
              </kbd>
              Select
            </div>
          </div>
        </div>

        {/* Mobile controls toggle button */}
        {showFilters && (
          <button
            onClick={() => setMobileControlsOpen(!mobileControlsOpen)}
            className="absolute top-36 left-4 z-30 md:hidden rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2 text-slate-400"
          >
            <Layers className="w-5 h-5" />
          </button>
        )}

        {/* Details drawer (right side) */}
        {selectedNode && (
          <div className="absolute top-0 right-0 bottom-0 w-80 md:w-96 bg-slate-900 border-l border-slate-700/50 flex flex-col overflow-hidden z-30">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {"moduleId" in selectedNode ? (
                    <Cpu className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <Layers className="w-5 h-5 text-indigo-400" />
                  )}
                  <h2 className="text-lg font-semibold text-white">
                    {selectedNode.name}
                  </h2>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(selectedNode.status)}
                <span className="text-sm font-medium text-white capitalize">
                  {selectedNode.status}
                </span>
                <span className="ml-auto text-xs px-2 py-1 bg-slate-800 rounded text-slate-400 uppercase">
                  {selectedNode.criticality}
                </span>
              </div>

              <p className="text-sm text-slate-400">{selectedNode.description}</p>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Metrics */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                  Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Health Score</div>
                    <div className="text-xl font-semibold text-white">
                      {selectedNode.healthScore}%
                    </div>
                  </div>

                  {"runsToday" in selectedNode && (
                    <>
                      <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                        <div className="text-xs text-slate-500 mb-1">Runs Today</div>
                        <div className="text-xl font-semibold text-white">
                          {selectedNode.runsToday}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                        <div className="text-xs text-slate-500 mb-1">Success Rate</div>
                        <div className="text-xl font-semibold text-white">
                          {selectedNode.successRate}%
                        </div>
                      </div>
                      <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                        <div className="text-xs text-slate-500 mb-1">Avg Latency</div>
                        <div className="text-xl font-semibold text-white">
                          {selectedNode.avgLatencyMs}ms
                        </div>
                      </div>
                    </>
                  )}

                  {"agentCount" in selectedNode && (
                    <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Agents</div>
                      <div className="text-xl font-semibold text-white">
                        {selectedNode.agentCount}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Run */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                  Last Run
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-white">
                    {formatTime(selectedNode.lastRunAt)}
                  </span>
                </div>
              </div>

              {/* Inputs */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                  Inputs
                </h3>
                <div className="space-y-1">
                  {selectedNode.inputs.map((input, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    >
                      {input}
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                  Outputs
                </h3>
                <div className="space-y-1">
                  {selectedNode.outputs.map((output, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    >
                      {output}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              {"moduleId" in selectedNode ? (
                <div>
                  <h3 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                    Module
                  </h3>
                  <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white">
                    {mockAgentModules.find((m) => m.id === selectedNode.moduleId)?.name}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                    Agents ({getAgentsByModule(selectedNode.id).length})
                  </h3>
                  <div className="space-y-1">
                    {getAgentsByModule(selectedNode.id)
                      .slice(0, 5)
                      .map((agent) => (
                        <button
                          key={agent.id}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white flex items-center justify-between hover:bg-slate-700 transition-colors text-left"
                          onClick={() => setSelectedNode(agent)}
                        >
                          <span>{agent.name}</span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* AI Preview Button - Coming soon */}
              <button
                disabled
                title="AI Preview coming soon"
                aria-disabled="true"
                className="w-full px-4 py-2 bg-slate-700 text-slate-400 font-medium rounded-lg cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
              >
                AI Preview
                <span className="text-xs px-1.5 py-0.5 bg-slate-600 rounded">Coming soon</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Build version indicator */}
      <BuildVersion />
    </div>
  );
}
