import { Agent, MapState, NodeKind, Personnel } from "./maos-types";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

export const seedPersonnel: Personnel[] = [
  {
    id: "personnel-1",
    name: "Avery Quinn",
    title: "Revenue Operations Lead",
    positionLevel: "Lead",
    team: "Ops",
    primaryResponsibilities: ["Pipeline hygiene", "Territory alignment", "Forecast accuracy"],
    primaryTasks: ["Review stage velocity", "Align weekly ops standup", "Audit CRM fields"],
    status: "Available",
    capacity: 72,
    metrics: {
      callsToday: 14,
      callsWeek: 68,
      salesToday: 2,
      salesWeek: 9,
      revenueWeek: 182000
    }
  },
  {
    id: "personnel-2",
    name: "Riley Chen",
    title: "Finance Partner",
    positionLevel: "Manager",
    team: "Finance",
    primaryResponsibilities: ["Cash flow", "Close readiness", "Spend oversight"],
    primaryTasks: ["Reconcile ledger", "Update burn report", "Review vendor invoices"],
    status: "On Call",
    capacity: 58,
    metrics: {
      callsToday: 6,
      callsWeek: 22,
      salesToday: 1,
      salesWeek: 4,
      revenueWeek: 91000
    }
  },
  {
    id: "personnel-3",
    name: "Jordan Patel",
    title: "Enterprise AE",
    positionLevel: "IC",
    team: "Sales",
    primaryResponsibilities: ["Top accounts", "Stakeholder mapping", "Deal strategy"],
    primaryTasks: ["Host exec briefing", "Update MEDDIC", "Coordinate legal review"],
    status: "Available",
    capacity: 64,
    metrics: {
      callsToday: 18,
      callsWeek: 84,
      salesToday: 1,
      salesWeek: 6,
      revenueWeek: 245000
    }
  },
  {
    id: "personnel-4",
    name: "Sasha Ito",
    title: "People Ops Manager",
    positionLevel: "Manager",
    team: "HR",
    primaryResponsibilities: ["Hiring pipeline", "Performance cycles", "Policy updates"],
    primaryTasks: ["Review headcount plan", "Conduct onboarding", "Publish handbook edits"],
    status: "Available",
    capacity: 80,
    metrics: {
      callsToday: 4,
      callsWeek: 18,
      salesToday: 0,
      salesWeek: 0,
      revenueWeek: 0
    }
  },
  {
    id: "personnel-5",
    name: "Maya Lopez",
    title: "Sales Development Lead",
    positionLevel: "Lead",
    team: "Sales",
    primaryResponsibilities: ["Outbound strategy", "Rep coaching", "Lead routing"],
    primaryTasks: ["Review call scripts", "Coach SDR huddle", "Monitor reply rates"],
    status: "On Call",
    capacity: 49,
    metrics: {
      callsToday: 32,
      callsWeek: 156,
      salesToday: 3,
      salesWeek: 11,
      revenueWeek: 128000
    }
  },
  {
    id: "personnel-6",
    name: "Theo Marshall",
    title: "Operations Analyst",
    positionLevel: "IC",
    team: "Ops",
    primaryResponsibilities: ["Workflow monitoring", "KPI dashboards", "Incident response"],
    primaryTasks: ["Review automation logs", "Update metrics board", "Resolve escalations"],
    status: "Available",
    capacity: 77,
    metrics: {
      callsToday: 9,
      callsWeek: 41,
      salesToday: 0,
      salesWeek: 1,
      revenueWeek: 12000
    }
  },
  {
    id: "personnel-7",
    name: "Elena Morales",
    title: "Senior Account Manager",
    positionLevel: "IC",
    team: "Sales",
    primaryResponsibilities: ["Renewals", "Expansion strategy", "Customer health"],
    primaryTasks: ["Review churn risks", "Plan QBRs", "Close renewal terms"],
    status: "Available",
    capacity: 68,
    metrics: {
      callsToday: 12,
      callsWeek: 61,
      salesToday: 2,
      salesWeek: 8,
      revenueWeek: 97000
    }
  },
  {
    id: "personnel-8",
    name: "Kiran Desai",
    title: "Payroll Specialist",
    positionLevel: "IC",
    team: "HR",
    primaryResponsibilities: ["Payroll accuracy", "Benefits coordination", "Compliance"],
    primaryTasks: ["Validate payroll run", "Sync benefits files", "Audit timecards"],
    status: "Offline",
    capacity: 35,
    metrics: {
      callsToday: 3,
      callsWeek: 12,
      salesToday: 0,
      salesWeek: 0,
      revenueWeek: 0
    }
  },
  {
    id: "personnel-9",
    name: "Noah Brooks",
    title: "Finance Analyst",
    positionLevel: "IC",
    team: "Finance",
    primaryResponsibilities: ["Budget tracking", "Variance analysis", "Vendor spend"],
    primaryTasks: ["Update budget model", "Analyze variance", "Report on spend"],
    status: "Available",
    capacity: 73,
    metrics: {
      callsToday: 5,
      callsWeek: 19,
      salesToday: 1,
      salesWeek: 3,
      revenueWeek: 54000
    }
  },
  {
    id: "personnel-10",
    name: "Priya Nair",
    title: "Customer Ops Director",
    positionLevel: "Director",
    team: "Ops",
    primaryResponsibilities: ["Service quality", "Escalations", "CS process design"],
    primaryTasks: ["Review support backlog", "Lead escalation war room", "Align CS ops"],
    status: "On Call",
    capacity: 54,
    metrics: {
      callsToday: 11,
      callsWeek: 47,
      salesToday: 2,
      salesWeek: 5,
      revenueWeek: 76000
    }
  }
];

export const seedAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Ledger Agent",
    module: "Finance",
    purpose: "Close reporting and ledger sync",
    ownerTeam: "Finance",
    inputs: ["GL entries", "Invoice feeds", "Expense reports"],
    outputs: ["Close summary", "Variance alerts", "Audit log"],
    status: "Running",
    utilization: 64,
    metrics: {
      runsToday: 24,
      runsWeek: 118,
      avgLatencyMs: 820,
      successRate: 98
    }
  },
  {
    id: "agent-2",
    name: "Pipeline Sentinel",
    module: "Sales",
    purpose: "Monitors pipeline risk and stage slippage",
    ownerTeam: "Sales",
    inputs: ["CRM stages", "Activity logs", "Forecast targets"],
    outputs: ["Risk digest", "Stage nudges", "Forecast deltas"],
    status: "Running",
    utilization: 71,
    metrics: {
      runsToday: 32,
      runsWeek: 165,
      avgLatencyMs: 640,
      successRate: 96
    }
  },
  {
    id: "agent-3",
    name: "Scheduling Agent",
    module: "Ops",
    purpose: "Aligns calendar blocks with operating cadence",
    ownerTeam: "Ops",
    inputs: ["Team calendars", "Meeting requests", "Priority tags"],
    outputs: ["Optimized schedules", "Conflict alerts"],
    status: "Idle",
    utilization: 43,
    metrics: {
      runsToday: 14,
      runsWeek: 74,
      avgLatencyMs: 520,
      successRate: 95
    }
  },
  {
    id: "agent-4",
    name: "People Pulse",
    module: "HR",
    purpose: "Tracks onboarding and engagement signals",
    ownerTeam: "HR",
    inputs: ["Survey responses", "Onboarding tasks", "Performance check-ins"],
    outputs: ["Engagement score", "Onboarding gaps"],
    status: "Running",
    utilization: 57,
    metrics: {
      runsToday: 19,
      runsWeek: 96,
      avgLatencyMs: 730,
      successRate: 97
    }
  },
  {
    id: "agent-5",
    name: "Sales Coach Agent",
    module: "Sales",
    purpose: "Coaches reps on call quality and talk tracks",
    ownerTeam: "Sales",
    inputs: ["Call recordings", "Coaching rubrics"],
    outputs: ["Coaching notes", "Scorecards"],
    status: "Running",
    utilization: 81,
    metrics: {
      runsToday: 41,
      runsWeek: 210,
      avgLatencyMs: 910,
      successRate: 94
    }
  },
  {
    id: "agent-6",
    name: "Ops QA Agent",
    module: "QA",
    purpose: "Validates workflow outputs for anomalies",
    ownerTeam: "Ops",
    inputs: ["Process logs", "Exception rules"],
    outputs: ["QA alerts", "Quality dashboard"],
    status: "Idle",
    utilization: 38,
    metrics: {
      runsToday: 17,
      runsWeek: 83,
      avgLatencyMs: 560,
      successRate: 93
    }
  },
  {
    id: "agent-7",
    name: "Comp Plan Agent",
    module: "Finance",
    purpose: "Calculates commissions and plan attainment",
    ownerTeam: "Finance",
    inputs: ["Quota tables", "Closed-won data"],
    outputs: ["Commission statements", "Plan attainment"],
    status: "Running",
    utilization: 69,
    metrics: {
      runsToday: 21,
      runsWeek: 102,
      avgLatencyMs: 780,
      successRate: 99
    }
  },
  {
    id: "agent-8",
    name: "Support Routing Agent",
    module: "Ops",
    purpose: "Routes escalations to the right pod",
    ownerTeam: "Ops",
    inputs: ["Ticket metadata", "SLA rules"],
    outputs: ["Routing decisions", "Escalation notes"],
    status: "Running",
    utilization: 74,
    metrics: {
      runsToday: 29,
      runsWeek: 142,
      avgLatencyMs: 610,
      successRate: 96
    }
  },
  {
    id: "agent-9",
    name: "Enablement Agent",
    module: "Enablement",
    purpose: "Delivers enablement content to reps",
    ownerTeam: "Sales",
    inputs: ["Content library", "Role profiles"],
    outputs: ["Learning tracks", "Content nudges"],
    status: "Paused",
    utilization: 29,
    metrics: {
      runsToday: 11,
      runsWeek: 58,
      avgLatencyMs: 690,
      successRate: 92
    }
  },
  {
    id: "agent-10",
    name: "Forecast Agent",
    module: "Sales",
    purpose: "Builds weekly forecasting narrative",
    ownerTeam: "Sales",
    inputs: ["Pipeline data", "Commit rollups"],
    outputs: ["Forecast brief", "Risk flags"],
    status: "Running",
    utilization: 66,
    metrics: {
      runsToday: 16,
      runsWeek: 91,
      avgLatencyMs: 840,
      successRate: 95
    }
  }
];

const nodeSpacing = { x: 260, y: 180 };
const startPosition = { x: 120, y: 140 };

const buildPosition = (index: number) => {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return {
    x: startPosition.x + column * nodeSpacing.x,
    y: startPosition.y + row * nodeSpacing.y
  };
};

export const buildSeedMapState = (personnel: Personnel[], agents: Agent[]): MapState => {
  const nodes = [...personnel, ...agents].map((item, index) => {
    const kind: NodeKind = "team" in item ? "personnel" : "agent";
    return {
      id: `node-${item.id}`,
      kind,
      refId: item.id,
      position: buildPosition(index)
    };
  });

  const edges = [
    { from: "personnel-3", to: "agent-2" },
    { from: "personnel-5", to: "agent-5" },
    { from: "personnel-2", to: "agent-1" },
    { from: "personnel-1", to: "agent-3" },
    { from: "personnel-6", to: "agent-8" }
  ];

  return {
    nodes,
    edges: edges.map((edge) => ({
      id: createId(),
      fromNodeId: `node-${edge.from}`,
      toNodeId: `node-${edge.to}`,
      kind: "personnel-agent"
    })),
    overlaysEnabled: false
  };
};

export const createMaosId = () => createId();
