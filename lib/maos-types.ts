export type PersonnelStatus = "Available" | "On Call" | "Offline";

export type AgentStatus = "Running" | "Idle" | "Paused";

export type SalesMetrics = {
  callsToday: number;
  callsWeek: number;
  salesToday: number;
  salesWeek: number;
  revenueWeek: number;
};

export type OpsMetrics = {
  jobsScheduledToday: number;
  jobsCompletedToday: number;
  backlog: number;
  overtimeHoursWeek: number;
};

export type FinanceMetrics = {
  invoicesProcessedToday: number;
  ARCallsWeek: number;
  closeTasksOpen: number;
  daysToCloseEstimate: number;
};

export type PersonnelMetrics = {
  sales?: SalesMetrics;
  ops?: OpsMetrics;
  finance?: FinanceMetrics;
};

export type AgentMetrics = {
  runsToday: number;
  runsWeek: number;
  avgLatencyMs: number;
  successRate: number;
  errorRate: number;
  lastRunAt: string;
};

export type Personnel = {
  id: string;
  name: string;
  title: string;
  positionLevel: "Executive" | "Director" | "Manager" | "Lead" | "IC";
  team: "Sales" | "Finance" | "Ops" | "HR" | "Exec";
  primaryResponsibilities: string[];
  primaryTasks: string[];
  status: PersonnelStatus;
  capacity: number;
  metrics: PersonnelMetrics;
  supervisorId?: string; // Reports to (undefined for CEO)
  directReportIds?: string[]; // Direct reports (computed)
};

export type Agent = {
  id: string;
  name: string;
  module:
    | "Sales Ops"
    | "Lead Routing"
    | "Ledger Close"
    | "AR Follow-up"
    | "Scheduling"
    | "QA"
    | "Compliance"
    | "Reporting";
  purpose: string;
  ownerTeam: "Sales" | "Finance" | "Ops" | "HR" | "Exec";
  inputs: string[];
  outputs: string[];
  status: AgentStatus;
  utilization: number;
  metrics: AgentMetrics;
  supportedTaskTypes?: CompanyTaskType[]; // Task types this agent can help with
  supportedKPIs?: string[]; // KPIs this agent monitors/improves
};

export type NodeKind = "personnel" | "agent";

export type MapNode = {
  id: string;
  kind: NodeKind;
  refId: string;
  position: { x: number; y: number };
};

export type MapEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  kind: "personnel-agent";
};

export type MapOverlayMode = "none" | "tasks" | "agents";

export type MapDensity = "compact" | "comfortable";

export type MapLabelMode = "off" | "keyOnly" | "all";

export type MapState = {
  nodes: MapNode[];
  edges: MapEdge[];
  overlaysEnabled: boolean;
  overlayMode?: MapOverlayMode;
  density?: MapDensity;
  labelMode?: MapLabelMode;
};

export type TaskStatus = "Backlog" | "In Progress" | "Blocked" | "Done";

export type TaskOwnerType = "personnel" | "agent";

export type Task = {
  id: string;
  title: string;
  description?: string;
  ownerType: TaskOwnerType;
  ownerId: string;
  priority: "Low" | "Med" | "High" | "Critical";
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags?: string[];
};

// Radial Org Map Types

export type FlowHealth = "green" | "amber" | "red";

export type PersonnelPresence = "offline" | "online" | "active" | "blocked";

export type RoleLevel = "Executive" | "Director" | "Manager" | "IC";

export type OrgDepartment = {
  id: string;
  name: string;
  color: string;
  efficiency: number; // 0-100
  flowHealth: FlowHealth;
  activeLoad: number; // tasks in motion
  leadUserId?: string; // Team lead/manager
};

export type OrgPerson = {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  presence: PersonnelPresence;
  leverageScore: number; // 0-100, high = gold edge
  avatarInitials: string;
  supervisorId?: string; // Reports to (undefined for CEO)
  roleLevel: RoleLevel; // Hierarchical level
  directReportIds?: string[]; // Direct reports (computed)
};

export type FlowEdge = {
  id: string;
  fromId: string;
  toId: string;
  type: "reports-to" | "collaborates" | "delegates";
  weight: number; // 0-1 for line thickness
};

export type OrgCore = {
  efficiencyScore: number; // 0-100
  activeLoad: number; // tasks in motion
  flowHealth: FlowHealth;
};

export type OrgMapData = {
  core: OrgCore;
  departments: OrgDepartment[];
  people: OrgPerson[];
  edges: FlowEdge[];
};

// Company Task List Types

export type CompanyTaskType =
  | "Sales"
  | "OrderWriting"
  | "DisputeResolution"
  | "Admin"
  | "Other";

export type CompanyTaskRevenueImpact = "Revenue" | "NonRevenue";

export type CompanyTaskPriority = "P1" | "P2" | "P3";

export type CompanyTaskStatus = "Planned" | "InProgress" | "Blocked" | "Done";

export type CompanyTaskMetrics = {
  callsMade?: number;
  ordersWritten?: number;
  salesAmount?: number;
  disputeValue?: number;
  customerCount?: number;
};

export type CompanyTask = {
  id: string;
  title: string;
  description?: string;
  ownerUserId: string;
  ownerName?: string; // Denormalized for quick display
  teamId: string;
  teamName?: string; // Denormalized for quick display
  supervisorId?: string; // Owner's supervisor
  supervisorName?: string; // Denormalized for quick display
  type: CompanyTaskType;
  revenueImpact: CompanyTaskRevenueImpact;
  priority: CompanyTaskPriority;
  status: CompanyTaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  linkedEntity?: {
    type: "order" | "customer" | "dispute";
    id: string;
  };
  estimatedEffort?: number; // in hours
  metrics?: CompanyTaskMetrics;
  agentSupportIds?: string[]; // Agents that can help with this task
};

export type TeamMetrics = {
  teamId: string;
  ordersWritten?: number;
  totalCalls?: number;
  customersReached?: number;
  totalSales?: number;
};
