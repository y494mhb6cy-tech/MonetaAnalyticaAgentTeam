"use client";

import React, { useMemo } from "react";
import { TrendingUp, Clock, HelpCircle, AlertTriangle, DollarSign, Users, Zap } from "lucide-react";
import type { CompanyTask, OrgMapData, OrgDepartment } from "../lib/maos-types";

interface RevenueDragOverlayProps {
  tasks: CompanyTask[];
  orgData: OrgMapData;
  selectedTeamId?: string | null;
  onTeamSelect?: (teamId: string | null) => void;
}

interface TeamStats {
  id: string;
  name: string;
  color: string;
  totalTasks: number;
  revenueTasks: number;
  adminTasks: number;
  supportTasks: number;
  unknownTasks: number;
  revenuePercent: number;
  adminPercent: number;
  revenueHours: number;
  adminHours: number;
  blockedTasks: number;
  headcount: number;
  efficiency: number;
  leverageRatio: number; // revenue tasks per person
}

function computeTeamStats(
  tasks: CompanyTask[],
  orgData: OrgMapData
): TeamStats[] {
  const { departments, people } = orgData;

  return departments.map((dept) => {
    const teamTasks = tasks.filter((t) => t.teamId === dept.id);
    const teamPeople = people.filter((p) => p.departmentId === dept.id);

    const revenueTasks = teamTasks.filter((t) => t.revenueImpact === "Revenue");
    const adminTasks = teamTasks.filter(
      (t) => t.revenueImpact === "NonRevenue" && t.type === "Admin"
    );
    const supportTasks = teamTasks.filter(
      (t) => t.type === "DisputeResolution" || t.type === "Other"
    );
    const unknownTasks = teamTasks.filter(
      (t) =>
        !revenueTasks.includes(t) &&
        !adminTasks.includes(t) &&
        !supportTasks.includes(t)
    );

    const total = teamTasks.length || 1;

    const estimateHours = (taskList: CompanyTask[]) =>
      taskList.reduce((sum, t) => sum + (t.estimatedEffort || 2), 0);

    const revenueHours = estimateHours(revenueTasks);
    const adminHours = estimateHours(adminTasks);

    return {
      id: dept.id,
      name: dept.name,
      color: dept.color,
      totalTasks: teamTasks.length,
      revenueTasks: revenueTasks.length,
      adminTasks: adminTasks.length,
      supportTasks: supportTasks.length,
      unknownTasks: unknownTasks.length,
      revenuePercent: Math.round((revenueTasks.length / total) * 100),
      adminPercent: Math.round((adminTasks.length / total) * 100),
      revenueHours,
      adminHours,
      blockedTasks: teamTasks.filter((t) => t.status === "Blocked").length,
      headcount: teamPeople.length,
      efficiency: dept.efficiency,
      leverageRatio: revenueTasks.length / Math.max(teamPeople.length, 1),
    };
  });
}

export default function RevenueDragOverlay({
  tasks,
  orgData,
  selectedTeamId,
  onTeamSelect,
}: RevenueDragOverlayProps) {
  const teamStats = useMemo(
    () => computeTeamStats(tasks, orgData),
    [tasks, orgData]
  );

  const totals = useMemo(() => {
    const revenueTasks = tasks.filter((t) => t.revenueImpact === "Revenue");
    const adminTasks = tasks.filter(
      (t) => t.revenueImpact === "NonRevenue" && t.type === "Admin"
    );
    const supportTasks = tasks.filter(
      (t) => t.type === "DisputeResolution" || t.type === "Other"
    );

    const total = tasks.length || 1;

    return {
      total: tasks.length,
      revenue: revenueTasks.length,
      admin: adminTasks.length,
      support: supportTasks.length,
      revenuePercent: Math.round((revenueTasks.length / total) * 100),
      adminPercent: Math.round((adminTasks.length / total) * 100),
    };
  }, [tasks]);

  // Sort by revenue focus
  const sortedTeams = [...teamStats].sort(
    (a, b) => b.revenuePercent - a.revenuePercent
  );

  // Identify issues
  const highAdminTeams = sortedTeams.filter(
    (t) => t.adminPercent > 40 && t.id !== "leadership"
  );
  const lowLeverageTeams = sortedTeams.filter(
    (t) => t.leverageRatio < 0.5 && t.id !== "leadership"
  );

  return (
    <div className="absolute left-4 top-24 z-20 w-80 space-y-3">
      {/* Summary card */}
      <div className="rounded-xl bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 p-4">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">
          Work Allocation
        </h3>

        {/* Distribution bar */}
        <div className="mb-4">
          <div className="flex h-4 rounded-full overflow-hidden bg-slate-800">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${totals.revenuePercent}%` }}
              title={`Revenue: ${totals.revenue} tasks`}
            />
            <div
              className="bg-amber-500 transition-all duration-500"
              style={{ width: `${totals.adminPercent}%` }}
              title={`Admin: ${totals.admin} tasks`}
            />
            <div
              className="bg-slate-500 transition-all duration-500"
              style={{
                width: `${100 - totals.revenuePercent - totals.adminPercent}%`,
              }}
              title={`Support: ${totals.support} tasks`}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Revenue {totals.revenuePercent}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Admin {totals.adminPercent}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Support
            </span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <div className="text-lg font-bold text-emerald-400">
              {totals.revenue}
            </div>
            <div className="text-[10px] text-slate-500">Revenue Tasks</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10">
            <div className="text-lg font-bold text-amber-400">
              {totals.admin}
            </div>
            <div className="text-[10px] text-slate-500">Admin Drag</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-500/10">
            <div className="text-lg font-bold text-slate-400">
              {totals.support}
            </div>
            <div className="text-[10px] text-slate-500">Support</div>
          </div>
        </div>
      </div>

      {/* Team breakdown */}
      <div className="rounded-xl bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 p-4 max-h-[40vh] overflow-y-auto">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 sticky top-0 bg-slate-900/95 pb-2">
          Team Breakdown
        </h3>

        <div className="space-y-2">
          {sortedTeams.map((team) => (
            <button
              key={team.id}
              onClick={() =>
                onTeamSelect?.(selectedTeamId === team.id ? null : team.id)
              }
              className={`w-full p-3 rounded-lg text-left transition-all ${
                selectedTeamId === team.id
                  ? "bg-slate-700/50 ring-1 ring-slate-500"
                  : "bg-slate-800/50 hover:bg-slate-700/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-sm font-medium text-white">
                    {team.name}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {team.headcount} people
                </span>
              </div>

              {/* Mini bar */}
              <div className="flex h-2 rounded-full overflow-hidden bg-slate-700 mb-2">
                <div
                  className="bg-emerald-500"
                  style={{ width: `${team.revenuePercent}%` }}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${team.adminPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px]">
                <span className="text-emerald-400">
                  {team.revenuePercent}% revenue
                </span>
                <span className="text-amber-400">
                  {team.adminPercent}% admin
                </span>
              </div>

              {/* Risk indicators */}
              {team.blockedTasks > 0 && (
                <div className="mt-2 flex items-center gap-1 text-red-400 text-[10px]">
                  <AlertTriangle className="w-3 h-3" />
                  {team.blockedTasks} blocked
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Issues panel */}
      {(highAdminTeams.length > 0 || lowLeverageTeams.length > 0) && (
        <div className="rounded-xl bg-slate-900/95 backdrop-blur-sm border border-amber-500/30 p-4">
          <h3 className="text-xs uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Time Leakage Detected
          </h3>

          <div className="space-y-2 text-xs">
            {highAdminTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-start gap-2 text-slate-300"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{team.name}</strong>: {team.adminPercent}% admin
                  overhead
                </span>
              </div>
            ))}
            {lowLeverageTeams.map((team) => (
              <div
                key={`leverage-${team.id}`}
                className="flex items-start gap-2 text-slate-300"
              >
                <Users className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{team.name}</strong>: Low leverage ratio (
                  {team.leverageRatio.toFixed(1)} rev tasks/person)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="rounded-xl bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 p-3">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400">Revenue</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-slate-400">Admin</span>
            </span>
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400">Support</span>
            </span>
          </div>
          <span className="text-slate-600">Click team to filter</span>
        </div>
      </div>
    </div>
  );
}
