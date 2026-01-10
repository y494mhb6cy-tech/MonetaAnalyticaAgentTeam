"use client";

import React, { useState, useMemo } from "react";
import { AgentArchitectureGraph } from "@/components/AgentArchitectureGraph";
import {
  mockAgentDepartments,
  mockAgentModules,
  mockAgentNodes,
  mockAgentDependencies,
  filterModules,
  filterAgents,
  getAgentsByModule,
  getDependencies,
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
} from "lucide-react";
import { ViewToggle } from "@/components/ViewToggle";
import { BuildVersion } from "@/components/BuildVersion";

export default function AgentArchitecturePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<AgentStatus | "">("");
  const [selectedCriticality, setSelectedCriticality] = useState<AgentCriticality | "">("");
  const [selectedNode, setSelectedNode] = useState<AgentModule | AgentNode | null>(null);
  const [showFilters, setShowFilters] = useState(true);

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
    // Get agents from filtered modules
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

  const handleModuleClick = (module: AgentModule) => {
    setSelectedNode(module);
  };

  const handleAgentClick = (agent: AgentNode) => {
    setSelectedNode(agent);
  };

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

  return (
    <div className="h-[calc(100vh-52px)] md:h-[calc(100vh-52px)] w-full bg-[var(--bg)] flex flex-col overflow-hidden pb-16 md:pb-0">
      {/* Top Navigation - Unified ViewToggle component */}
      <div className="absolute top-4 left-4 z-30">
        <ViewToggle />
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Filter Panel */}
        {showFilters && (
          <div className="w-80 bg-[var(--panel)] border-r border-[var(--border)] flex flex-col">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text)]">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="md:hidden p-1 hover:bg-[var(--hover)] rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search modules or agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              {/* Department Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-[var(--muted)] mb-2">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="">All Departments</option>
                  {mockAgentDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-[var(--muted)] mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as AgentStatus | "")}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="">All Statuses</option>
                  <option value="healthy">Healthy</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Criticality Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-[var(--muted)] mb-2">
                  Criticality
                </label>
                <select
                  value={selectedCriticality}
                  onChange={(e) => setSelectedCriticality(e.target.value as AgentCriticality | "")}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="">All Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(searchQuery || selectedDepartment || selectedStatus || selectedCriticality) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedDepartment("");
                    setSelectedStatus("");
                    setSelectedCriticality("");
                  }}
                  className="w-full px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--hover)] rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Results Summary */}
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Layers className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-[var(--text)] font-medium">{filteredModules.length}</span>
                  <span className="text-[var(--muted)]">modules</span>
                </div>
                <div className="flex items-center gap-1">
                  <Cpu className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-[var(--text)] font-medium">{filteredAgents.length}</span>
                  <span className="text-[var(--muted)]">agents</span>
                </div>
              </div>
            </div>

            {/* Department Stats */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-medium text-[var(--muted)] mb-3 uppercase tracking-wider">
                Department Health
              </h3>
              <div className="space-y-2">
                {mockAgentDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: dept.color }}
                        />
                        <span className="text-sm font-medium text-[var(--text)]">
                          {dept.name}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--muted)]">
                        {dept.healthScore}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${dept.healthScore}%`,
                          backgroundColor: dept.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Graph Area */}
        <div className="flex-1 relative">
          {!showFilters && (
            <button
              onClick={() => setShowFilters(true)}
              className="absolute top-4 left-4 z-20 p-2 bg-[var(--panel)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {filteredModules.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center">
                  <Layers className="w-8 h-8 text-[var(--muted)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                  No modules found
                </h3>
                <p className="text-sm text-[var(--muted)] mb-4">
                  No modules match your current filter criteria. Try adjusting your filters or clearing them to see all modules.
                </p>
                {(searchQuery || selectedDepartment || selectedStatus || selectedCriticality) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDepartment("");
                      setSelectedStatus("");
                      setSelectedCriticality("");
                    }}
                    className="px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--hover)] rounded-lg transition-colors"
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

        {/* Right Detail Drawer */}
        {selectedNode && (
          <div className="w-96 bg-[var(--panel)] border-l border-[var(--border)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {"moduleId" in selectedNode ? (
                    <Cpu className="w-5 h-5 text-[var(--accent)]" />
                  ) : (
                    <Layers className="w-5 h-5 text-[var(--accent)]" />
                  )}
                  <h2 className="text-lg font-semibold text-[var(--text)]">
                    {selectedNode.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-[var(--hover)] rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(selectedNode.status)}
                <span className="text-sm font-medium text-[var(--text)] capitalize">
                  {selectedNode.status}
                </span>
                <span className="ml-auto text-xs px-2 py-1 bg-[var(--bg)] rounded text-[var(--muted)] uppercase">
                  {selectedNode.criticality}
                </span>
              </div>

              <p className="text-sm text-[var(--muted)]">{selectedNode.description}</p>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Metrics */}
              <div>
                <h3 className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
                  Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                    <div className="text-xs text-[var(--muted)] mb-1">Health Score</div>
                    <div className="text-xl font-semibold text-[var(--text)]">
                      {selectedNode.healthScore}%
                    </div>
                  </div>

                  {"runsToday" in selectedNode && (
                    <>
                      <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                        <div className="text-xs text-[var(--muted)] mb-1">Runs Today</div>
                        <div className="text-xl font-semibold text-[var(--text)]">
                          {selectedNode.runsToday}
                        </div>
                      </div>
                      <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                        <div className="text-xs text-[var(--muted)] mb-1">Success Rate</div>
                        <div className="text-xl font-semibold text-[var(--text)]">
                          {selectedNode.successRate}%
                        </div>
                      </div>
                      <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                        <div className="text-xs text-[var(--muted)] mb-1">Avg Latency</div>
                        <div className="text-xl font-semibold text-[var(--text)]">
                          {selectedNode.avgLatencyMs}ms
                        </div>
                      </div>
                    </>
                  )}

                  {"agentCount" in selectedNode && (
                    <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                      <div className="text-xs text-[var(--muted)] mb-1">Agents</div>
                      <div className="text-xl font-semibold text-[var(--text)]">
                        {selectedNode.agentCount}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Run */}
              <div>
                <h3 className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
                  Last Run
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-[var(--muted)]" />
                  <span className="text-[var(--text)]">
                    {formatTime(selectedNode.lastRunAt)}
                  </span>
                </div>
              </div>

              {/* Inputs */}
              <div>
                <h3 className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
                  Inputs
                </h3>
                <div className="space-y-1">
                  {selectedNode.inputs.map((input, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded text-sm text-[var(--text)]"
                    >
                      {input}
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div>
                <h3 className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
                  Outputs
                </h3>
                <div className="space-y-1">
                  {selectedNode.outputs.map((output, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded text-sm text-[var(--text)]"
                    >
                      {output}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              {"moduleId" in selectedNode ? (
                <div>
                  <h3 className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
                    Module
                  </h3>
                  <div className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded text-sm text-[var(--text)]">
                    {mockAgentModules.find((m) => m.id === selectedNode.moduleId)?.name}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
                    Agents ({getAgentsByModule(selectedNode.id).length})
                  </h3>
                  <div className="space-y-1">
                    {getAgentsByModule(selectedNode.id)
                      .slice(0, 5)
                      .map((agent) => (
                        <div
                          key={agent.id}
                          className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded text-sm text-[var(--text)] flex items-center justify-between cursor-pointer hover:bg-[var(--hover)]"
                          onClick={() => setSelectedNode(agent)}
                        >
                          <span>{agent.name}</span>
                          <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* AI Preview Button - Coming soon */}
              <button
                disabled
                title="AI Preview coming soon"
                className="w-full px-4 py-2 bg-slate-700 text-slate-400 font-medium rounded-lg cursor-not-allowed opacity-60"
              >
                AI Preview (Coming soon)
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
