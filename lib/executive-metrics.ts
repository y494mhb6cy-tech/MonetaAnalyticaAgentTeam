/**
 * MAOS Executive Metrics Engine
 *
 * Computes real-time organizational metrics for leadership decision-making.
 * Separates revenue-producing work from administrative drag.
 */

import type {
  OrgMapData,
  CompanyTask,
  OrgDepartment,
  OrgPerson,
} from "./maos-types";

// Work classification types
export type WorkClassification = "revenue" | "admin" | "support" | "unknown";

export type CapacityStatus = "available" | "allocated" | "overloaded" | "blocked";

export type RiskLevel = "low" | "medium" | "high" | "critical";

// Executive summary metrics
export interface ExecutiveSummary {
  // Capacity metrics
  totalCapacity: number;
  allocatedCapacity: number;
  availableCapacity: number;
  capacityUtilization: number; // 0-100

  // Work distribution
  revenueWorkPercent: number;
  adminDragPercent: number;
  supportPercent: number;
  unknownPercent: number;

  // Risk signals
  blockedCount: number;
  overloadedTeamsCount: number;
  criticalPathRisk: RiskLevel;

  // Agent coverage
  agentCoverage: number; // % of tasks with agent support
  agentUtilization: number; // average agent utilization

  // Time allocation
  revenueHours: number;
  adminHours: number;
  supportHours: number;

  // Trend indicators
  capacityTrend: "up" | "down" | "stable";
  revenueTrend: "up" | "down" | "stable";
  riskTrend: "improving" | "worsening" | "stable";
}

// Team breakdown
export interface TeamBreakdown {
  id: string;
  name: string;
  color: string;
  headcount: number;
  activeCount: number;
  blockedCount: number;
  capacityUtilization: number;
  revenueWorkPercent: number;
  adminDragPercent: number;
  taskCount: number;
  efficiency: number;
  flowHealth: "green" | "amber" | "red";
  leverageScore: number; // aggregate leverage of team members
  riskLevel: RiskLevel;
}

// Person breakdown for drill-down
export interface PersonBreakdown {
  id: string;
  name: string;
  role: string;
  team: string;
  presence: string;
  taskCount: number;
  revenueTaskCount: number;
  adminTaskCount: number;
  blockedTaskCount: number;
  leverageScore: number;
  isHighLeverage: boolean;
  capacityStatus: CapacityStatus;
}

// Risk item
export interface RiskItem {
  id: string;
  type: "blocked_person" | "overloaded_team" | "admin_heavy" | "capacity_gap" | "agent_degraded";
  severity: RiskLevel;
  title: string;
  description: string;
  entityId: string;
  entityType: "person" | "team" | "agent";
  actionLabel: string;
}

// Compute executive summary from org data and tasks
export function computeExecutiveSummary(
  orgData: OrgMapData,
  tasks: CompanyTask[],
  agents: { utilization: number; status: string }[] = []
): ExecutiveSummary {
  const { people, departments } = orgData;

  // Headcount and presence
  const activeCount = people.filter(p => p.presence === "active" || p.presence === "online").length;
  const blockedCount = people.filter(p => p.presence === "blocked").length;
  const totalHeadcount = people.length;

  // Task classification
  const revenueTasks = tasks.filter(t => t.revenueImpact === "Revenue");
  const adminTasks = tasks.filter(t => t.revenueImpact === "NonRevenue" && t.type === "Admin");
  const supportTasks = tasks.filter(t => t.type === "DisputeResolution" || t.type === "Other");

  const totalTasks = tasks.length || 1;

  // Work hours estimation (based on task count and estimated effort)
  const estimateHours = (taskList: CompanyTask[]) =>
    taskList.reduce((sum, t) => sum + (t.estimatedEffort || 2), 0);

  const revenueHours = estimateHours(revenueTasks);
  const adminHours = estimateHours(adminTasks);
  const supportHours = estimateHours(supportTasks);
  const totalHours = revenueHours + adminHours + supportHours || 1;

  // Capacity metrics
  const totalCapacity = totalHeadcount * 40; // 40 hours/week theoretical
  const allocatedCapacity = totalHours;
  const availableCapacity = Math.max(0, totalCapacity - allocatedCapacity);

  // Team health
  const overloadedTeams = departments.filter(d => {
    const teamPeople = people.filter(p => p.departmentId === d.id);
    const teamTasks = tasks.filter(t => t.teamId === d.id);
    const tasksPerPerson = teamTasks.length / Math.max(teamPeople.length, 1);
    return tasksPerPerson > 7; // More than 7 tasks per person = overloaded
  });

  // Agent metrics
  const avgAgentUtilization = agents.length > 0
    ? agents.reduce((sum, a) => sum + a.utilization, 0) / agents.length
    : 0;

  const tasksWithAgentSupport = tasks.filter(t => t.agentSupportIds && t.agentSupportIds.length > 0);

  // Risk assessment
  const criticalRisk = blockedCount > 5 || overloadedTeams.length > 2;
  const highRisk = blockedCount > 2 || overloadedTeams.length > 1;
  const mediumRisk = blockedCount > 0 || overloadedTeams.length > 0;

  return {
    totalCapacity,
    allocatedCapacity,
    availableCapacity,
    capacityUtilization: Math.round((allocatedCapacity / totalCapacity) * 100),

    revenueWorkPercent: Math.round((revenueTasks.length / totalTasks) * 100),
    adminDragPercent: Math.round((adminTasks.length / totalTasks) * 100),
    supportPercent: Math.round((supportTasks.length / totalTasks) * 100),
    unknownPercent: Math.round(((totalTasks - revenueTasks.length - adminTasks.length - supportTasks.length) / totalTasks) * 100),

    blockedCount,
    overloadedTeamsCount: overloadedTeams.length,
    criticalPathRisk: criticalRisk ? "critical" : highRisk ? "high" : mediumRisk ? "medium" : "low",

    agentCoverage: Math.round((tasksWithAgentSupport.length / totalTasks) * 100),
    agentUtilization: Math.round(avgAgentUtilization),

    revenueHours,
    adminHours,
    supportHours,

    // Simulated trends (would be computed from historical data)
    capacityTrend: "stable",
    revenueTrend: "up",
    riskTrend: "stable",
  };
}

// Compute team breakdowns
export function computeTeamBreakdowns(
  orgData: OrgMapData,
  tasks: CompanyTask[]
): TeamBreakdown[] {
  const { people, departments } = orgData;

  return departments.map(dept => {
    const teamPeople = people.filter(p => p.departmentId === dept.id);
    const teamTasks = tasks.filter(t => t.teamId === dept.id);

    const activePeople = teamPeople.filter(p => p.presence === "active" || p.presence === "online");
    const blockedPeople = teamPeople.filter(p => p.presence === "blocked");

    const revenueTasks = teamTasks.filter(t => t.revenueImpact === "Revenue");
    const adminTasks = teamTasks.filter(t => t.type === "Admin");

    const totalTeamTasks = teamTasks.length || 1;
    const tasksPerPerson = totalTeamTasks / Math.max(teamPeople.length, 1);

    // Leverage score (average of team members)
    const avgLeverage = teamPeople.length > 0
      ? teamPeople.reduce((sum, p) => sum + p.leverageScore, 0) / teamPeople.length
      : 0;

    // Risk assessment
    let riskLevel: RiskLevel = "low";
    if (blockedPeople.length > 2 || tasksPerPerson > 10) riskLevel = "critical";
    else if (blockedPeople.length > 1 || tasksPerPerson > 8) riskLevel = "high";
    else if (blockedPeople.length > 0 || tasksPerPerson > 6) riskLevel = "medium";

    return {
      id: dept.id,
      name: dept.name,
      color: dept.color,
      headcount: teamPeople.length,
      activeCount: activePeople.length,
      blockedCount: blockedPeople.length,
      capacityUtilization: Math.min(100, Math.round(tasksPerPerson * 15)), // rough estimation
      revenueWorkPercent: Math.round((revenueTasks.length / totalTeamTasks) * 100),
      adminDragPercent: Math.round((adminTasks.length / totalTeamTasks) * 100),
      taskCount: teamTasks.length,
      efficiency: dept.efficiency,
      flowHealth: dept.flowHealth,
      leverageScore: Math.round(avgLeverage),
      riskLevel,
    };
  });
}

// Compute person breakdowns for a team
export function computePersonBreakdowns(
  orgData: OrgMapData,
  tasks: CompanyTask[],
  teamId?: string
): PersonBreakdown[] {
  const { people, departments } = orgData;

  const filteredPeople = teamId
    ? people.filter(p => p.departmentId === teamId)
    : people;

  return filteredPeople.map(person => {
    const personTasks = tasks.filter(t => t.ownerUserId === person.id);
    const revenueTasks = personTasks.filter(t => t.revenueImpact === "Revenue");
    const adminTasks = personTasks.filter(t => t.type === "Admin");
    const blockedTasks = personTasks.filter(t => t.status === "Blocked");

    const dept = departments.find(d => d.id === person.departmentId);

    // Capacity status
    let capacityStatus: CapacityStatus = "available";
    if (person.presence === "blocked") capacityStatus = "blocked";
    else if (personTasks.length > 8) capacityStatus = "overloaded";
    else if (personTasks.length > 4) capacityStatus = "allocated";

    return {
      id: person.id,
      name: person.name,
      role: person.role,
      team: dept?.name || "Unknown",
      presence: person.presence,
      taskCount: personTasks.length,
      revenueTaskCount: revenueTasks.length,
      adminTaskCount: adminTasks.length,
      blockedTaskCount: blockedTasks.length,
      leverageScore: person.leverageScore,
      isHighLeverage: person.leverageScore >= 75,
      capacityStatus,
    };
  });
}

// Compute risk items
export function computeRiskItems(
  orgData: OrgMapData,
  tasks: CompanyTask[]
): RiskItem[] {
  const { people, departments } = orgData;
  const risks: RiskItem[] = [];

  // Blocked people risks
  const blockedPeople = people.filter(p => p.presence === "blocked");
  blockedPeople.forEach(person => {
    const personTasks = tasks.filter(t => t.ownerUserId === person.id);
    risks.push({
      id: `risk-blocked-${person.id}`,
      type: "blocked_person",
      severity: person.leverageScore >= 75 ? "critical" : "high",
      title: `${person.name} is blocked`,
      description: `High-leverage team member with ${personTasks.length} assigned tasks is blocked`,
      entityId: person.id,
      entityType: "person",
      actionLabel: "Review blockers",
    });
  });

  // Overloaded teams
  departments.forEach(dept => {
    const teamPeople = people.filter(p => p.departmentId === dept.id);
    const teamTasks = tasks.filter(t => t.teamId === dept.id);
    const tasksPerPerson = teamTasks.length / Math.max(teamPeople.length, 1);

    if (tasksPerPerson > 7) {
      risks.push({
        id: `risk-overload-${dept.id}`,
        type: "overloaded_team",
        severity: tasksPerPerson > 10 ? "critical" : "high",
        title: `${dept.name} is overloaded`,
        description: `${Math.round(tasksPerPerson)} tasks per person (target: <6)`,
        entityId: dept.id,
        entityType: "team",
        actionLabel: "Rebalance workload",
      });
    }
  });

  // Admin-heavy teams
  departments.forEach(dept => {
    const teamTasks = tasks.filter(t => t.teamId === dept.id);
    const adminTasks = teamTasks.filter(t => t.type === "Admin");
    const adminPercent = (adminTasks.length / Math.max(teamTasks.length, 1)) * 100;

    if (adminPercent > 40 && dept.id !== "leadership") {
      risks.push({
        id: `risk-admin-${dept.id}`,
        type: "admin_heavy",
        severity: adminPercent > 60 ? "high" : "medium",
        title: `${dept.name} has high admin load`,
        description: `${Math.round(adminPercent)}% of work is non-revenue admin`,
        entityId: dept.id,
        entityType: "team",
        actionLabel: "Audit admin tasks",
      });
    }
  });

  // Sort by severity
  const severityOrder: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return risks;
}

// Format numbers for display
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Format percentage
export function formatPercent(num: number): string {
  return `${Math.round(num)}%`;
}

// Get risk color
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "critical": return "#ef4444"; // red-500
    case "high": return "#f97316"; // orange-500
    case "medium": return "#eab308"; // yellow-500
    case "low": return "#22c55e"; // green-500
  }
}

// Get capacity color
export function getCapacityColor(utilization: number): string {
  if (utilization >= 90) return "#ef4444"; // red
  if (utilization >= 75) return "#f97316"; // orange
  if (utilization >= 50) return "#eab308"; // yellow
  return "#22c55e"; // green
}
