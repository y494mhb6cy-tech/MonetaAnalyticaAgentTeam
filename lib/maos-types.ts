export type PersonnelStatus = "Available" | "On Call" | "Offline";

export type AgentStatus = "Running" | "Idle" | "Paused";

export type PersonnelMetrics = {
  callsToday: number;
  callsWeek: number;
  salesToday: number;
  salesWeek: number;
  revenueWeek: number;
};

export type AgentMetrics = {
  runsToday: number;
  runsWeek: number;
  avgLatencyMs: number;
  successRate: number;
};

export type Personnel = {
  id: string;
  name: string;
  title: string;
  positionLevel: "IC" | "Lead" | "Manager" | "Director";
  team: "Sales" | "Finance" | "Ops" | "HR";
  primaryResponsibilities: string[];
  primaryTasks: string[];
  status: PersonnelStatus;
  capacity: number;
  metrics: PersonnelMetrics;
};

export type Agent = {
  id: string;
  name: string;
  module: "Finance" | "Ops" | "HR" | "Sales" | "Enablement" | "QA";
  purpose: string;
  ownerTeam: "Sales" | "Finance" | "Ops" | "HR";
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
