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

export type MapState = {
  nodes: MapNode[];
  edges: MapEdge[];
  overlaysEnabled: boolean;
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
