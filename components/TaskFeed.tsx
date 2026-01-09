"use client";

import { useState, useMemo } from "react";
import type { CompanyTask, CompanyTaskType, CompanyTaskStatus, MapDensity } from "@/lib/maos-types";
import {
  Phone,
  FileText,
  AlertCircle,
  Briefcase,
  MoreHorizontal,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  Search,
  Filter
} from "lucide-react";

interface TaskFeedProps {
  tasks: CompanyTask[];
  onTaskClick: (task: CompanyTask) => void;
  selectedTaskId?: string;
  density?: MapDensity;
  filterTeamId?: string | null;
  filterPersonId?: string | null;
}

const taskTypeIcons: Record<CompanyTaskType, typeof Phone> = {
  Sales: Phone,
  OrderWriting: FileText,
  DisputeResolution: AlertCircle,
  Admin: Briefcase,
  Other: MoreHorizontal,
};

const taskTypeColors: Record<CompanyTaskType, string> = {
  Sales: "text-green-600 bg-green-50",
  OrderWriting: "text-blue-600 bg-blue-50",
  DisputeResolution: "text-orange-600 bg-orange-50",
  Admin: "text-purple-600 bg-purple-50",
  Other: "text-gray-600 bg-gray-50",
};

const statusIcons: Record<CompanyTaskStatus, typeof Circle> = {
  Planned: Circle,
  InProgress: Clock,
  Blocked: XCircle,
  Done: CheckCircle2,
};

const statusColors: Record<CompanyTaskStatus, string> = {
  Planned: "text-gray-400",
  InProgress: "text-blue-500",
  Blocked: "text-red-500",
  Done: "text-green-500",
};

const priorityColors = {
  P1: "text-red-600 bg-red-50 border-red-200",
  P2: "text-orange-600 bg-orange-50 border-orange-200",
  P3: "text-gray-600 bg-gray-50 border-gray-200",
};

type FilterType = "all" | "revenue" | "nonrevenue" | "blocked" | "disputes" | "orders" | "sales";
type SortField = "updatedAt" | "priority" | "status" | "type";

export default function TaskFeed({
  tasks,
  onTaskClick,
  selectedTaskId,
  density = "comfortable",
  filterTeamId,
  filterPersonId,
}: TaskFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("updatedAt");

  // Apply filters and sorting
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Apply team/person filters
    if (filterTeamId) {
      filtered = filtered.filter((t) => t.teamId === filterTeamId);
    }
    if (filterPersonId) {
      filtered = filtered.filter((t) => t.ownerUserId === filterPersonId);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.ownerName?.toLowerCase().includes(query) ||
          t.teamName?.toLowerCase().includes(query)
      );
    }

    // Apply quick filters
    switch (activeFilter) {
      case "revenue":
        filtered = filtered.filter((t) => t.revenueImpact === "Revenue" && t.status !== "Done");
        break;
      case "nonrevenue":
        filtered = filtered.filter((t) => t.revenueImpact === "NonRevenue");
        break;
      case "blocked":
        filtered = filtered.filter((t) => t.status === "Blocked");
        break;
      case "disputes":
        filtered = filtered.filter((t) => t.type === "DisputeResolution" && t.status !== "Done");
        break;
      case "orders":
        filtered = filtered.filter((t) => t.type === "OrderWriting" && t.status !== "Done");
        break;
      case "sales":
        filtered = filtered.filter((t) => t.type === "Sales" && t.status !== "Done");
        break;
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortField) {
        case "priority":
          const priorityOrder = { P1: 0, P2: 1, P3: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "status":
          const statusOrder = { Blocked: 0, InProgress: 1, Planned: 2, Done: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case "type":
          return a.type.localeCompare(b.type);
        case "updatedAt":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return sorted;
  }, [tasks, searchQuery, activeFilter, sortField, filterTeamId, filterPersonId]);

  const rowHeight = density === "compact" ? "h-14" : "h-20";

  // Calculate summary stats
  const stats = useMemo(() => {
    const revenueCount = tasks.filter((t) => t.revenueImpact === "Revenue" && t.status !== "Done").length;
    const blockedCount = tasks.filter((t) => t.status === "Blocked").length;
    const disputeCount = tasks.filter((t) => t.type === "DisputeResolution" && t.status !== "Done").length;
    const orderCount = tasks.filter((t) => t.type === "OrderWriting" && t.status !== "Done").length;
    const salesCount = tasks.filter((t) => t.type === "Sales" && t.status !== "Done").length;

    return { revenueCount, blockedCount, disputeCount, orderCount, salesCount };
  }, [tasks]);

  return (
    <div className="flex flex-col h-full bg-white border-t border-gray-200">
      {/* Header with search and filters */}
      <div className="flex-none px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, people, teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="updatedAt">Recent</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="type">Type</option>
          </select>
        </div>

        {/* Quick filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All ({filteredAndSortedTasks.length})
          </button>
          <button
            onClick={() => setActiveFilter("revenue")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors inline-flex items-center gap-1 ${
              activeFilter === "revenue"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Revenue ({stats.revenueCount})
          </button>
          <button
            onClick={() => setActiveFilter("blocked")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors inline-flex items-center gap-1 ${
              activeFilter === "blocked"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <XCircle className="w-3 h-3" />
            Blocked ({stats.blockedCount})
          </button>
          <button
            onClick={() => setActiveFilter("disputes")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeFilter === "disputes"
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Disputes ({stats.disputeCount})
          </button>
          <button
            onClick={() => setActiveFilter("orders")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeFilter === "orders"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Orders ({stats.orderCount})
          </button>
          <button
            onClick={() => setActiveFilter("sales")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeFilter === "sales"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Sales ({stats.salesCount})
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Filter className="w-12 h-12 mb-2 text-gray-300" />
            <p className="text-sm">No tasks match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAndSortedTasks.map((task) => {
              const TypeIcon = taskTypeIcons[task.type];
              const StatusIcon = statusIcons[task.status];
              const isSelected = task.id === selectedTaskId;

              return (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`w-full ${rowHeight} px-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                    isSelected ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                  }`}
                >
                  {/* Type icon */}
                  <div className={`flex-none w-8 h-8 rounded-lg flex items-center justify-center ${taskTypeColors[task.type]}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </h3>
                      {task.revenueImpact === "Revenue" && (
                        <TrendingUp className="flex-none w-3 h-3 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="truncate">{task.ownerName}</span>
                      <span>•</span>
                      <span className="truncate">{task.teamName}</span>
                      {density === "comfortable" && task.supervisorName && (
                        <>
                          <span>•</span>
                          <span className="truncate">Reports to: {task.supervisorName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status and priority */}
                  <div className="flex-none flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium border rounded ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    <StatusIcon className={`w-4 h-4 ${statusColors[task.status]}`} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
