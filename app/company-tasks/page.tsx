"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  companyTasks,
  salesOrgData,
  getTaskSummary,
  getTasksByTeam,
  getTasksByPerson,
} from "../../lib/sales-mock-data";
import type {
  CompanyTask,
  CompanyTaskStatus,
  CompanyTaskType,
  CompanyTaskRevenueImpact,
  CompanyTaskPriority,
} from "../../lib/maos-types";
import { Filter, TrendingUp, AlertCircle, Package, Phone, DollarSign } from "lucide-react";

type FilterState = {
  teamId: string;
  personId: string;
  type: CompanyTaskType | "All";
  revenueImpact: CompanyTaskRevenueImpact | "All";
  status: CompanyTaskStatus | "All";
  priority: CompanyTaskPriority | "All";
};

function CompanyTasksContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    teamId: "all",
    personId: "all",
    type: "All",
    revenueImpact: "All",
    status: "All",
    priority: "All",
  });

  // Initialize filters from URL parameters
  useEffect(() => {
    const teamParam = searchParams.get("team");
    const personParam = searchParams.get("person");

    if (teamParam || personParam) {
      setFilters((prev) => ({
        ...prev,
        teamId: teamParam || "all",
        personId: personParam || "all",
      }));
    }
  }, [searchParams]);

  const summary = useMemo(() => getTaskSummary(), []);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    let tasks = [...companyTasks];

    if (filters.teamId !== "all") {
      tasks = tasks.filter((t) => t.teamId === filters.teamId);
    }

    if (filters.personId !== "all") {
      tasks = tasks.filter((t) => t.ownerUserId === filters.personId);
    }

    if (filters.type !== "All") {
      tasks = tasks.filter((t) => t.type === filters.type);
    }

    if (filters.revenueImpact !== "All") {
      tasks = tasks.filter((t) => t.revenueImpact === filters.revenueImpact);
    }

    if (filters.status !== "All") {
      tasks = tasks.filter((t) => t.status === filters.status);
    }

    if (filters.priority !== "All") {
      tasks = tasks.filter((t) => t.priority === filters.priority);
    }

    // Sort: revenue tasks first, then by priority, then by status
    return tasks.sort((a, b) => {
      // Revenue tasks first
      if (a.revenueImpact === "Revenue" && b.revenueImpact !== "Revenue") return -1;
      if (a.revenueImpact !== "Revenue" && b.revenueImpact === "Revenue") return 1;

      // Then by priority
      const priorityOrder = { P1: 0, P2: 1, P3: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by status
      const statusOrder = { Blocked: 0, InProgress: 1, Planned: 2, Done: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [filters]);

  // Get people filtered by selected team
  const availablePeople = useMemo(() => {
    if (filters.teamId === "all") return salesOrgData.people;
    return salesOrgData.people.filter((p) => p.departmentId === filters.teamId);
  }, [filters.teamId]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Reset person filter if team changes
      ...(key === "teamId" && value !== prev.teamId ? { personId: "all" } : {}),
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <div className="flex-none border-b border-[color:var(--border)] bg-[var(--panel)] px-6 py-4">
        <h1 className="text-2xl font-bold text-[color:var(--text)]">Company Tasks</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          Track revenue-producing work and daily plans across the organization
        </p>
      </div>

      {/* Summary Metrics Cards */}
      <div className="flex-none border-b border-[color:var(--border)] bg-[var(--panel)] px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Revenue Tasks */}
          <MetricCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Revenue Planned"
            value={summary.revenuePlanned}
            color="text-green-500"
          />
          <MetricCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Revenue In Progress"
            value={summary.revenueInProgress}
            color="text-blue-500"
          />
          <MetricCard
            icon={<AlertCircle className="w-4 h-4" />}
            label="Revenue Blocked"
            value={summary.revenueBlocked}
            color="text-red-500"
          />
          <MetricCard
            icon={<AlertCircle className="w-4 h-4" />}
            label="Disputes Open"
            value={summary.disputeResolution}
            color="text-orange-500"
          />

          {/* Activity Metrics */}
          <MetricCard
            icon={<Package className="w-4 h-4" />}
            label="Orders Today"
            value={summary.ordersWrittenToday}
            color="text-indigo-500"
          />
          <MetricCard
            icon={<Phone className="w-4 h-4" />}
            label="Calls Today"
            value={summary.totalCallsToday}
            color="text-purple-500"
          />
          <MetricCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Customers Reached"
            value={summary.customersReachedToday}
            color="text-cyan-500"
          />
          <MetricCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Sales Today"
            value={summary.salesToday}
            color="text-emerald-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex-none border-b border-[color:var(--border)] bg-[var(--panel)] px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Team Filter */}
          <select
            value={filters.teamId}
            onChange={(e) => handleFilterChange("teamId", e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Teams</option>
            {salesOrgData.departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Person Filter */}
          <select
            value={filters.personId}
            onChange={(e) => handleFilterChange("personId", e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All People</option>
            {availablePeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>

          {/* Task Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Types</option>
            <option value="Sales">Sales</option>
            <option value="OrderWriting">Order Writing</option>
            <option value="DisputeResolution">Dispute Resolution</option>
            <option value="Admin">Admin</option>
            <option value="Other">Other</option>
          </select>

          {/* Revenue Impact Filter */}
          <select
            value={filters.revenueImpact}
            onChange={(e) => handleFilterChange("revenueImpact", e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Revenue Impact</option>
            <option value="Revenue">Revenue-Producing</option>
            <option value="NonRevenue">Non-Revenue</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="InProgress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Done">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange("priority", e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Normal</option>
          </select>

          {/* Results count */}
          <div className="ml-auto text-sm text-[color:var(--muted)]">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[color:var(--muted)]">No tasks match the current filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2">
      <div className="flex items-center gap-2 mb-1">
        <div className={color}>{icon}</div>
        <div className="text-xs text-[color:var(--muted)] uppercase tracking-wide">{label}</div>
      </div>
      <div className="text-xl font-bold text-[color:var(--text)]">{value}</div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task }: { task: CompanyTask }) {
  const person = salesOrgData.people.find((p) => p.id === task.ownerUserId);
  const team = salesOrgData.departments.find((d) => d.id === task.teamId);

  const statusColors = {
    Planned: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    InProgress: "bg-green-500/10 text-green-500 border-green-500/20",
    Blocked: "bg-red-500/10 text-red-500 border-red-500/20",
    Done: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  const priorityColors = {
    P1: "bg-red-500/10 text-red-400 border-red-500/20",
    P2: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    P3: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const typeIcons = {
    Sales: "💼",
    OrderWriting: "📦",
    DisputeResolution: "⚠️",
    Admin: "📋",
    Other: "•",
  };

  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--panel)] p-4 hover:bg-[var(--panel2)] transition-colors">
      <div className="flex items-start gap-4">
        {/* Task Type Icon */}
        <div className="flex-none text-2xl mt-0.5">{typeIcons[task.type]}</div>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <h3 className="font-medium text-[color:var(--text)] flex-1">{task.title}</h3>

            {/* Revenue Badge */}
            {task.revenueImpact === "Revenue" && (
              <span className="flex-none px-2 py-0.5 text-xs font-medium rounded border bg-green-500/10 text-green-500 border-green-500/20">
                Revenue
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
            <span className="flex items-center gap-1.5">
              <span className="font-medium">{person?.name || "Unknown"}</span>
              <span className="text-xs">•</span>
              <span style={{ color: team?.color }}>{team?.name || "Unknown Team"}</span>
            </span>

            {/* Status */}
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${statusColors[task.status]}`}>
              {task.status === "InProgress" ? "In Progress" : task.status}
            </span>

            {/* Priority */}
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>

            {/* Type */}
            <span className="text-xs">
              {task.type === "OrderWriting"
                ? "Order Writing"
                : task.type === "DisputeResolution"
                ? "Dispute Resolution"
                : task.type}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span className="text-xs">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}

            {/* Estimated Effort */}
            {task.estimatedEffort && (
              <span className="text-xs">
                ~{task.estimatedEffort}h
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyTasksPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[color:var(--muted)]">Loading tasks...</span>
        </div>
      </div>
    }>
      <CompanyTasksContent />
    </Suspense>
  );
}
