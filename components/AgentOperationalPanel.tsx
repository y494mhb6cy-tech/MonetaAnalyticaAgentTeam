"use client";

import React, { useMemo } from "react";
import {
  Activity,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Users,
  FileStack,
  TrendingUp,
  TrendingDown,
  BarChart3,
  GitBranch,
  Shield,
  Eye,
} from "lucide-react";
import type { Agent, CompanyTask } from "../lib/maos-types";
import { getAgentHealth, type AgentDependency } from "../lib/agent-dependencies";

interface AgentOperationalPanelProps {
  agent: Agent;
  dependencies: AgentDependency[];
  connectedAgents: {
    upstream: Agent[];
    downstream: Agent[];
  };
  supportedTasks: CompanyTask[];
  onViewDependencies?: () => void;
  onRunAudit?: () => void;
}

// Agent status colors
function getStatusColor(status: Agent["status"]) {
  switch (status) {
    case "Running":
      return "#22c55e";
    case "Idle":
      return "#94a3b8";
    case "Paused":
      return "#f59e0b";
  }
}

function getHealthColor(health: "Healthy" | "Warning" | "Critical") {
  switch (health) {
    case "Healthy":
      return "#22c55e";
    case "Warning":
      return "#f59e0b";
    case "Critical":
      return "#ef4444";
  }
}

// Utilization gauge
function UtilizationGauge({ value }: { value: number }) {
  const color =
    value >= 90 ? "#ef4444" : value >= 70 ? "#f59e0b" : value >= 40 ? "#22c55e" : "#94a3b8";

  return (
    <div className="relative w-full h-2 rounded-full bg-slate-700 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
        style={{
          width: `${value}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

// SLA badge
function SLABadge({ successRate }: { successRate: number }) {
  const status =
    successRate >= 99 ? "excellent" : successRate >= 95 ? "good" : successRate >= 90 ? "warning" : "critical";

  const colors = {
    excellent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    good: "bg-green-500/10 text-green-400 border-green-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colors[status]}`}
    >
      {successRate >= 95 ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {successRate}% SLA
    </span>
  );
}

export default function AgentOperationalPanel({
  agent,
  dependencies,
  connectedAgents,
  supportedTasks,
  onViewDependencies,
  onRunAudit,
}: AgentOperationalPanelProps) {
  const health = getAgentHealth(agent);

  // Compute task impact metrics
  const taskMetrics = useMemo(() => {
    const total = supportedTasks.length;
    const inProgress = supportedTasks.filter((t) => t.status === "InProgress").length;
    const blocked = supportedTasks.filter((t) => t.status === "Blocked").length;
    const revenue = supportedTasks.filter((t) => t.revenueImpact === "Revenue").length;

    return { total, inProgress, blocked, revenue };
  }, [supportedTasks]);

  // Performance trend (simulated)
  const performanceTrend = agent.metrics.successRate >= 95 ? "up" : agent.metrics.successRate >= 90 ? "stable" : "down";

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: getStatusColor(agent.status) }}
            />
            <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">{agent.purpose}</p>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg border text-sm font-medium"
          style={{
            borderColor: `${getHealthColor(health)}40`,
            backgroundColor: `${getHealthColor(health)}10`,
            color: getHealthColor(health),
          }}
        >
          {health}
        </div>
      </div>

      {/* Module info badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-1 rounded-md bg-slate-800 text-xs text-slate-300 border border-slate-700">
          {agent.module}
        </span>
        <span className="px-2 py-1 rounded-md bg-slate-800 text-xs text-slate-300 border border-slate-700">
          {agent.ownerTeam}
        </span>
        <span className="px-2 py-1 rounded-md bg-slate-800 text-xs text-slate-300 border border-slate-700">
          {agent.status}
        </span>
        <SLABadge successRate={agent.metrics.successRate} />
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Utilization</span>
            <span className="text-lg font-bold text-white">{agent.utilization}%</span>
          </div>
          <UtilizationGauge value={agent.utilization} />
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Latency</span>
            {performanceTrend === "up" ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : performanceTrend === "down" ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : null}
          </div>
          <div className="text-lg font-bold text-white">{agent.metrics.avgLatencyMs}ms</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Runs Today</div>
          <div className="text-lg font-bold text-white">{agent.metrics.runsToday}</div>
          <div className="text-xs text-slate-500">{agent.metrics.runsWeek} this week</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Error Rate</div>
          <div
            className="text-lg font-bold"
            style={{
              color: agent.metrics.errorRate <= 5 ? "#22c55e" : agent.metrics.errorRate <= 10 ? "#f59e0b" : "#ef4444",
            }}
          >
            {agent.metrics.errorRate}%
          </div>
          <div className="text-xs text-slate-500">
            {agent.metrics.successRate}% success
          </div>
        </div>
      </div>

      {/* Inputs & Outputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Inputs</span>
          </div>
          <ul className="space-y-1">
            {agent.inputs.map((input, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                {input}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Outputs</span>
          </div>
          <ul className="space-y-1">
            {agent.outputs.map((output, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                {output}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Task Impact */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <FileStack className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 uppercase tracking-wider">Task Support</span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-white">{taskMetrics.total}</div>
            <div className="text-[10px] text-slate-500">Total</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-400">{taskMetrics.inProgress}</div>
            <div className="text-[10px] text-slate-500">Active</div>
          </div>
          <div>
            <div className="text-xl font-bold text-red-400">{taskMetrics.blocked}</div>
            <div className="text-[10px] text-slate-500">Blocked</div>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-400">{taskMetrics.revenue}</div>
            <div className="text-[10px] text-slate-500">Revenue</div>
          </div>
        </div>
      </div>

      {/* Dependencies */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Dependencies</span>
          </div>
          {onViewDependencies && (
            <button
              onClick={onViewDependencies}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View graph
            </button>
          )}
        </div>

        <div className="space-y-3">
          {connectedAgents.upstream.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 mb-2">Upstream (provides input)</div>
              <div className="flex flex-wrap gap-2">
                {connectedAgents.upstream.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700/50 text-xs text-slate-300"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(a.status) }}
                    />
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {connectedAgents.downstream.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 mb-2">Downstream (receives output)</div>
              <div className="flex flex-wrap gap-2">
                {connectedAgents.downstream.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700/50 text-xs text-slate-300"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(a.status) }}
                    />
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {connectedAgents.upstream.length === 0 && connectedAgents.downstream.length === 0 && (
            <div className="text-sm text-slate-500">No dependencies</div>
          )}
        </div>
      </div>

      {/* Audit & Compliance */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Audit Trail</span>
          </div>
          {onRunAudit && (
            <button
              onClick={onRunAudit}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Run audit
            </button>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Last run</span>
            <span className="text-slate-300">
              {new Date(agent.metrics.lastRunAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Decisions influenced</span>
            <span className="text-slate-300">{taskMetrics.total} tasks</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Data sources</span>
            <span className="text-slate-300">{agent.inputs.length} inputs</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Output actions</span>
            <span className="text-slate-300">{agent.outputs.length} outputs</span>
          </div>
        </div>
      </div>

      {/* Who relies on this */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 uppercase tracking-wider">Who Relies on This</span>
        </div>
        <div className="text-sm text-slate-300">
          <p>
            This agent supports <strong className="text-white">{taskMetrics.total} tasks</strong> across
            the <strong className="text-white">{agent.ownerTeam}</strong> team.
          </p>
          {taskMetrics.revenue > 0 && (
            <p className="mt-2">
              <strong className="text-emerald-400">{taskMetrics.revenue}</strong> of these are
              revenue-producing tasks.
            </p>
          )}
          {connectedAgents.downstream.length > 0 && (
            <p className="mt-2">
              <strong className="text-white">{connectedAgents.downstream.length} other agents</strong>{" "}
              depend on this agent&apos;s output.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors">
          <Eye className="w-4 h-4" />
          View Logs
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">
          <BarChart3 className="w-4 h-4" />
          Metrics
        </button>
      </div>
    </div>
  );
}
