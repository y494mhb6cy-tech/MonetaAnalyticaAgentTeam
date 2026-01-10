"use client";

import { useEffect } from "react";
import { X, Calendar, User, Users, TrendingUp, Clock, DollarSign, Phone, FileText, AlertCircle, Briefcase, Sparkles } from "lucide-react";
import type { CompanyTask, CompanyTaskType } from "@/lib/maos-types";

interface TaskDetailsDrawerProps {
  task: CompanyTask | null;
  onClose: () => void;
  onRunAgent?: (agentId: string) => void;
}

const taskTypeIcons: Record<CompanyTaskType, typeof Phone> = {
  Sales: Phone,
  OrderWriting: FileText,
  DisputeResolution: AlertCircle,
  Admin: Briefcase,
  Other: Briefcase,
};

const taskTypeLabels: Record<CompanyTaskType, string> = {
  Sales: "Sales Call",
  OrderWriting: "Order Writing",
  DisputeResolution: "Dispute Resolution",
  Admin: "Admin Task",
  Other: "Other",
};

const statusColors = {
  Planned: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  InProgress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Blocked: "bg-red-500/20 text-red-400 border-red-500/30",
  Done: "bg-green-500/20 text-green-400 border-green-500/30",
};

const priorityColors = {
  P1: "bg-red-500/20 text-red-400 border-red-500/30",
  P2: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  P3: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function TaskDetailsDrawer({
  task,
  onClose,
  onRunAgent,
}: TaskDetailsDrawerProps) {
  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && task) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [task, onClose]);

  if (!task) return null;

  const TypeIcon = taskTypeIcons[task.type];

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full lg:w-[480px] bg-slate-900 shadow-2xl z-50 overflow-y-auto border-l border-slate-700/50">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close task details"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Task type and title */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <TypeIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-1">{taskTypeLabels[task.type]}</div>
                <h3 className="text-base font-semibold text-white">{task.title}</h3>
              </div>
            </div>
          </div>

          {/* Status and Priority badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 text-xs font-medium border rounded-full ${statusColors[task.status]}`}>
              {task.status}
            </span>
            <span className={`px-3 py-1 text-xs font-medium border rounded-full ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            {task.revenueImpact === "Revenue" && (
              <span className="px-3 py-1 text-xs font-medium border rounded-full bg-green-500/20 text-green-400 border-green-500/30 inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Revenue Impact
              </span>
            )}
          </div>

          {/* Key info */}
          <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-0.5">Owner</div>
                <div className="text-sm font-medium text-white">{task.ownerName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-slate-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-0.5">Team</div>
                <div className="text-sm font-medium text-white">{task.teamName}</div>
              </div>
            </div>

            {task.supervisorName && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-0.5">Supervisor</div>
                  <div className="text-sm font-medium text-white">{task.supervisorName}</div>
                </div>
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-0.5">Due Date</div>
                  <div className="text-sm font-medium text-white">
                    {new Date(task.dueDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            )}

            {task.estimatedEffort && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-0.5">Estimated Effort</div>
                  <div className="text-sm font-medium text-white">{task.estimatedEffort} hours</div>
                </div>
              </div>
            )}
          </div>

          {/* Task Metrics */}
          {task.metrics && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Metrics</h4>
              <div className="grid grid-cols-2 gap-3">
                {task.metrics.callsMade !== undefined && (
                  <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <div className="text-xs text-blue-400 mb-1">Calls Made</div>
                    <div className="text-lg font-semibold text-white">{task.metrics.callsMade}</div>
                  </div>
                )}
                {task.metrics.ordersWritten !== undefined && (
                  <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <div className="text-xs text-green-400 mb-1">Orders Written</div>
                    <div className="text-lg font-semibold text-white">{task.metrics.ordersWritten}</div>
                  </div>
                )}
                {task.metrics.salesAmount !== undefined && (
                  <div className="p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                    <div className="text-xs text-emerald-400 mb-1">Sales Amount</div>
                    <div className="text-lg font-semibold text-white">
                      ${task.metrics.salesAmount.toLocaleString()}
                    </div>
                  </div>
                )}
                {task.metrics.disputeValue !== undefined && (
                  <div className="p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
                    <div className="text-xs text-orange-400 mb-1">Dispute Value</div>
                    <div className="text-lg font-semibold text-white">
                      ${task.metrics.disputeValue.toLocaleString()}
                    </div>
                  </div>
                )}
                {task.metrics.customerCount !== undefined && (
                  <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    <div className="text-xs text-purple-400 mb-1">Customers</div>
                    <div className="text-lg font-semibold text-white">{task.metrics.customerCount}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggested Agents */}
          {task.agentSupportIds && task.agentSupportIds.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Suggested AI Agents</h4>
              <div className="space-y-2">
                {task.agentSupportIds.map((agentId) => {
                  const agentNames: Record<string, string> = {
                    "agent-sales-ops": "Sales Ops Agent",
                    "agent-lead-routing": "Lead Routing Agent",
                    "agent-ar-followup": "AR Follow-up Agent",
                    "agent-reporting": "Reporting Agent",
                    "agent-compliance": "Compliance Agent",
                  };

                  const agentDescriptions: Record<string, string> = {
                    "agent-sales-ops": "Automate sales pipeline management and lead qualification",
                    "agent-lead-routing": "Intelligently route leads to the right sales reps",
                    "agent-ar-followup": "Automated accounts receivable follow-up and reminders",
                    "agent-reporting": "Generate insights and reports from task data",
                    "agent-compliance": "Ensure regulatory compliance and audit trails",
                  };

                  return (
                    <div
                      key={agentId}
                      className="p-3 border border-slate-700/50 rounded-lg hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center flex-none">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white mb-1">
                              {agentNames[agentId] || agentId}
                            </div>
                            <div className="text-xs text-slate-400">
                              {agentDescriptions[agentId] || "AI-powered task automation"}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRunAgent?.(agentId)}
                          className="flex-none px-3 py-1 text-xs font-medium text-purple-400 bg-purple-500/20 hover:bg-purple-500/30 rounded border border-purple-500/30 transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Timeline</h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span>Created {formatDate(task.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span>Updated {formatDate(task.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Description (if exists) */}
          {task.description && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
              <p className="text-sm text-slate-400">{task.description}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
