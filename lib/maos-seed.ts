import { Agent, MapState, NodeKind, Personnel, Task, TaskOwnerType, TaskStatus } from "./maos-types";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

const hashSeed = (seed: string) => {
  let hash = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
};

const createSeededRng = (seed: string) => {
  const seedFn = hashSeed(seed);
  let state = seedFn();
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const DEMO_SEED = "moneta-analytica-demo-v2";

const personnelBase: Array<Omit<Personnel, "status" | "capacity" | "metrics"> & { metrics: Personnel["metrics"] }> = [
  {
    id: "personnel-1",
    name: "Camille Laurent",
    title: "Chief Executive Officer",
    positionLevel: "Executive",
    team: "Exec",
    primaryResponsibilities: ["Vision & capital strategy", "Executive cadence", "Investor alignment"],
    primaryTasks: ["Board update", "Weekly exec 1:1s", "Strategic hiring approvals"],
    metrics: {}
  },
  {
    id: "personnel-2",
    name: "Marcus Jansen",
    title: "Chief Financial Officer",
    positionLevel: "Executive",
    team: "Exec",
    primaryResponsibilities: ["Capital allocation", "Risk oversight", "Financial narrative"],
    primaryTasks: ["Review cash runway", "Update investor deck", "Approve close scope"],
    metrics: {}
  },
  {
    id: "personnel-3",
    name: "Avery Quinn",
    title: "Revenue Operations Lead",
    positionLevel: "Lead",
    team: "Ops",
    primaryResponsibilities: ["Pipeline hygiene", "Territory alignment", "Forecast accuracy"],
    primaryTasks: ["Review stage velocity", "Align weekly ops standup", "Audit CRM fields"],
    metrics: {
      ops: {
        jobsScheduledToday: 12,
        jobsCompletedToday: 9,
        backlog: 18,
        overtimeHoursWeek: 6
      }
    }
  },
  {
    id: "personnel-4",
    name: "Jordan Patel",
    title: "Enterprise Account Executive",
    positionLevel: "IC",
    team: "Sales",
    primaryResponsibilities: ["Top accounts", "Stakeholder mapping", "Deal strategy"],
    primaryTasks: ["Host exec briefing", "Update MEDDIC", "Coordinate legal review"],
    metrics: {
      sales: {
        callsToday: 18,
        callsWeek: 84,
        salesToday: 1,
        salesWeek: 6,
        revenueWeek: 245000
      }
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
    metrics: {
      sales: {
        callsToday: 32,
        callsWeek: 156,
        salesToday: 3,
        salesWeek: 11,
        revenueWeek: 128000
      }
    }
  },
  {
    id: "personnel-6",
    name: "Elena Morales",
    title: "Senior Account Manager",
    positionLevel: "IC",
    team: "Sales",
    primaryResponsibilities: ["Renewals", "Expansion strategy", "Customer health"],
    primaryTasks: ["Review churn risks", "Plan QBRs", "Close renewal terms"],
    metrics: {
      sales: {
        callsToday: 12,
        callsWeek: 61,
        salesToday: 2,
        salesWeek: 8,
        revenueWeek: 97000
      }
    }
  },
  {
    id: "personnel-7",
    name: "Theo Marshall",
    title: "Operations Analyst",
    positionLevel: "IC",
    team: "Ops",
    primaryResponsibilities: ["Workflow monitoring", "KPI dashboards", "Incident response"],
    primaryTasks: ["Review automation logs", "Update metrics board", "Resolve escalations"],
    metrics: {
      ops: {
        jobsScheduledToday: 18,
        jobsCompletedToday: 15,
        backlog: 22,
        overtimeHoursWeek: 8
      }
    }
  },
  {
    id: "personnel-8",
    name: "Priya Nair",
    title: "Customer Ops Director",
    positionLevel: "Director",
    team: "Ops",
    primaryResponsibilities: ["Service quality", "Escalations", "CS process design"],
    primaryTasks: ["Review support backlog", "Lead escalation war room", "Align CS ops"],
    metrics: {
      ops: {
        jobsScheduledToday: 24,
        jobsCompletedToday: 20,
        backlog: 36,
        overtimeHoursWeek: 12
      }
    }
  },
  {
    id: "personnel-9",
    name: "Riley Chen",
    title: "Finance Partner",
    positionLevel: "Manager",
    team: "Finance",
    primaryResponsibilities: ["Cash flow", "Close readiness", "Spend oversight"],
    primaryTasks: ["Reconcile ledger", "Update burn report", "Review vendor invoices"],
    metrics: {
      finance: {
        invoicesProcessedToday: 54,
        ARCallsWeek: 22,
        closeTasksOpen: 11,
        daysToCloseEstimate: 5
      }
    }
  },
  {
    id: "personnel-10",
    name: "Noah Brooks",
    title: "Finance Analyst",
    positionLevel: "IC",
    team: "Finance",
    primaryResponsibilities: ["Budget tracking", "Variance analysis", "Vendor spend"],
    primaryTasks: ["Update budget model", "Analyze variance", "Report on spend"],
    metrics: {
      finance: {
        invoicesProcessedToday: 38,
        ARCallsWeek: 14,
        closeTasksOpen: 8,
        daysToCloseEstimate: 6
      }
    }
  },
  {
    id: "personnel-11",
    name: "Farah Wainwright",
    title: "Controller",
    positionLevel: "Manager",
    team: "Finance",
    primaryResponsibilities: ["Close orchestration", "Revenue recognition", "Audit readiness"],
    primaryTasks: ["Finalize accruals", "Review rev rec", "Coordinate audit PBC"],
    metrics: {
      finance: {
        invoicesProcessedToday: 46,
        ARCallsWeek: 19,
        closeTasksOpen: 6,
        daysToCloseEstimate: 4
      }
    }
  },
  {
    id: "personnel-12",
    name: "Sasha Ito",
    title: "People Ops Manager",
    positionLevel: "Manager",
    team: "HR",
    primaryResponsibilities: ["Hiring pipeline", "Performance cycles", "Policy updates"],
    primaryTasks: ["Review headcount plan", "Conduct onboarding", "Publish handbook edits"],
    metrics: {}
  },
  {
    id: "personnel-13",
    name: "Kiran Desai",
    title: "Payroll Specialist",
    positionLevel: "IC",
    team: "HR",
    primaryResponsibilities: ["Payroll accuracy", "Benefits coordination", "Compliance"],
    primaryTasks: ["Validate payroll run", "Sync benefits files", "Audit timecards"],
    metrics: {}
  },
  {
    id: "personnel-14",
    name: "Keon Willis",
    title: "Sales Enablement Manager",
    positionLevel: "Manager",
    team: "Sales",
    primaryResponsibilities: ["Playbook rollout", "Training cadence", "Win/loss insights"],
    primaryTasks: ["Build coaching plan", "Run onboarding", "Update enablement portal"],
    metrics: {
      sales: {
        callsToday: 7,
        callsWeek: 39,
        salesToday: 0,
        salesWeek: 2,
        revenueWeek: 54000
      }
    }
  },
  {
    id: "personnel-15",
    name: "Lena Hoffman",
    title: "Operations Scheduler",
    positionLevel: "IC",
    team: "Ops",
    primaryResponsibilities: ["Resource allocation", "Schedule integrity", "Shift planning"],
    primaryTasks: ["Balance rosters", "Update coverage grid", "Resolve conflicts"],
    metrics: {
      ops: {
        jobsScheduledToday: 30,
        jobsCompletedToday: 28,
        backlog: 14,
        overtimeHoursWeek: 4
      }
    }
  },
  {
    id: "personnel-16",
    name: "Adrian Kim",
    title: "VP of Revenue",
    positionLevel: "Director",
    team: "Sales",
    primaryResponsibilities: ["Revenue strategy", "Regional coverage", "Forecast stewardship"],
    primaryTasks: ["Review regional commits", "Align pricing strategy", "Escalate risk deals"],
    metrics: {
      sales: {
        callsToday: 9,
        callsWeek: 52,
        salesToday: 1,
        salesWeek: 5,
        revenueWeek: 188000
      }
    }
  }
];

const agentBase: Array<Omit<Agent, "status" | "utilization" | "metrics">> = [
  {
    id: "agent-1",
    name: "Ledger Close Agent",
    module: "Ledger Close",
    purpose: "Automates close checklists and reconciliations",
    ownerTeam: "Finance",
    inputs: ["GL entries", "Close checklist", "Subledger balances"],
    outputs: ["Close status", "Variance notes", "Journal entry pack"]
  },
  {
    id: "agent-2",
    name: "Lead Router",
    module: "Lead Routing",
    purpose: "Assigns inbound leads to the right segment and owner",
    ownerTeam: "Sales",
    inputs: ["Inbound form data", "Territory rules", "Rep capacity"],
    outputs: ["Lead assignments", "Routing exceptions"]
  },
  {
    id: "agent-3",
    name: "Pipeline Sentinel",
    module: "Sales Ops",
    purpose: "Monitors pipeline health and stage slippage",
    ownerTeam: "Sales",
    inputs: ["CRM stages", "Activity logs", "Forecast targets"],
    outputs: ["Risk digest", "Stage nudges", "Forecast deltas"]
  },
  {
    id: "agent-4",
    name: "AR Follow-up Bot",
    module: "AR Follow-up",
    purpose: "Prioritizes collection outreach based on aging risk",
    ownerTeam: "Finance",
    inputs: ["A/R aging", "Payment history", "Customer tiers"],
    outputs: ["Collection queue", "Escalation notes"]
  },
  {
    id: "agent-5",
    name: "Scheduling Orchestrator",
    module: "Scheduling",
    purpose: "Balances staffing schedules against SLA coverage",
    ownerTeam: "Ops",
    inputs: ["Team calendars", "Shift templates", "Workload forecast"],
    outputs: ["Optimized schedule", "Coverage gaps"]
  },
  {
    id: "agent-6",
    name: "Ops QA Agent",
    module: "QA",
    purpose: "Validates workflow outputs for anomalies",
    ownerTeam: "Ops",
    inputs: ["Process logs", "Exception rules"],
    outputs: ["QA alerts", "Quality dashboard"]
  },
  {
    id: "agent-7",
    name: "Compliance Sentinel",
    module: "Compliance",
    purpose: "Checks regulatory alignment and audit trails",
    ownerTeam: "Finance",
    inputs: ["Policy rules", "Audit logs", "Approval records"],
    outputs: ["Compliance flags", "Audit-ready trail"]
  },
  {
    id: "agent-8",
    name: "Revenue Reporting",
    module: "Reporting",
    purpose: "Builds weekly revenue narrative for exec staff",
    ownerTeam: "Exec",
    inputs: ["Forecast rollups", "Bookings", "Churn metrics"],
    outputs: ["Executive report", "Narrative highlights"]
  },
  {
    id: "agent-9",
    name: "Sales Coach Agent",
    module: "Sales Ops",
    purpose: "Coaches reps on call quality and talk tracks",
    ownerTeam: "Sales",
    inputs: ["Call recordings", "Coaching rubrics"],
    outputs: ["Coaching notes", "Scorecards"]
  },
  {
    id: "agent-10",
    name: "Collections Prioritizer",
    module: "AR Follow-up",
    purpose: "Ranks high-risk invoices for immediate outreach",
    ownerTeam: "Finance",
    inputs: ["Open invoices", "Payment promises", "Customer risk"],
    outputs: ["Priority list", "Call scripts"]
  },
  {
    id: "agent-11",
    name: "Forecast Narrator",
    module: "Reporting",
    purpose: "Generates the weekly forecast storyline",
    ownerTeam: "Sales",
    inputs: ["Commit rollups", "Stage deltas", "Rep notes"],
    outputs: ["Forecast brief", "Risk flags"]
  },
  {
    id: "agent-12",
    name: "Deal Desk QA",
    module: "QA",
    purpose: "Validates pricing and approvals on enterprise deals",
    ownerTeam: "Sales",
    inputs: ["Deal desk submissions", "Approval matrix"],
    outputs: ["Deal QA checklist", "Approval gaps"]
  },
  {
    id: "agent-13",
    name: "Policy Watchtower",
    module: "Compliance",
    purpose: "Monitors policy adherence across HR and Ops",
    ownerTeam: "HR",
    inputs: ["Policy docs", "Incident logs", "Training records"],
    outputs: ["Compliance summary", "Training reminders"]
  },
  {
    id: "agent-14",
    name: "Capacity Balancer",
    module: "Scheduling",
    purpose: "Rebalances shifts based on capacity risk",
    ownerTeam: "Ops",
    inputs: ["Capacity plan", "Absence alerts", "Backlog risk"],
    outputs: ["Shift recommendations", "Coverage alerts"]
  },
  {
    id: "agent-15",
    name: "Lead Insight Reporter",
    module: "Lead Routing",
    purpose: "Analyzes lead response time and conversion",
    ownerTeam: "Sales",
    inputs: ["Response times", "Lead stages", "Rep notes"],
    outputs: ["Lead response report", "Conversion funnel"]
  },
  {
    id: "agent-16",
    name: "Cash Flow Sentinel",
    module: "Ledger Close",
    purpose: "Tracks cash burn anomalies and forecasting risk",
    ownerTeam: "Finance",
    inputs: ["Bank feeds", "Cash runway model", "Spend approvals"],
    outputs: ["Cash risk alerts", "Runway summary"]
  }
];

const statusCycle: Personnel["status"][] = ["Available", "On Call", "Offline", "On Call", "Available"];
const agentStatusCycle: Agent["status"][] = ["Running", "Running", "Idle", "Running", "Paused"];

const enrichPersonnel = () => {
  const rng = createSeededRng(DEMO_SEED);
  return personnelBase.map((person, index) => {
    const capacityBase = 45 + Math.floor(rng() * 45);
    const capacity = Math.min(98, capacityBase + (index % 3) * 6);
    return {
      ...person,
      status: statusCycle[index % statusCycle.length],
      capacity
    };
  });
};

const createLastRunAt = (rng: () => number) => {
  const base = new Date("2024-06-19T18:00:00Z");
  const hoursAgo = Math.floor(rng() * 36) + 1;
  return new Date(base.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
};

const enrichAgents = () => {
  const rng = createSeededRng(`${DEMO_SEED}-agents`);
  return agentBase.map((agent, index) => {
    const utilization = 40 + Math.floor(rng() * 50);
    const degraded = [6, 10, 13].includes(index);
    const successRate = degraded ? 86 + Math.floor(rng() * 4) : 93 + Math.floor(rng() * 6);
    const errorRate = Math.max(1, 100 - successRate);
    return {
      ...agent,
      status: agentStatusCycle[index % agentStatusCycle.length],
      utilization,
      metrics: {
        runsToday: 10 + Math.floor(rng() * 32),
        runsWeek: 70 + Math.floor(rng() * 160),
        avgLatencyMs: 420 + Math.floor(rng() * 620),
        successRate,
        errorRate,
        lastRunAt: createLastRunAt(rng)
      }
    };
  });
};

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

const buildSeedEdges = () => {
  const edges = [
    ["personnel-4", "agent-2"],
    ["personnel-4", "agent-3"],
    ["personnel-4", "agent-9"],
    ["personnel-5", "agent-2"],
    ["personnel-5", "agent-15"],
    ["personnel-6", "agent-3"],
    ["personnel-6", "agent-9"],
    ["personnel-7", "agent-5"],
    ["personnel-7", "agent-14"],
    ["personnel-8", "agent-5"],
    ["personnel-8", "agent-6"],
    ["personnel-8", "agent-14"],
    ["personnel-9", "agent-1"],
    ["personnel-9", "agent-4"],
    ["personnel-9", "agent-16"],
    ["personnel-10", "agent-1"],
    ["personnel-10", "agent-4"],
    ["personnel-10", "agent-7"],
    ["personnel-11", "agent-1"],
    ["personnel-11", "agent-7"],
    ["personnel-11", "agent-16"],
    ["personnel-12", "agent-13"],
    ["personnel-12", "agent-6"],
    ["personnel-13", "agent-13"],
    ["personnel-14", "agent-9"],
    ["personnel-14", "agent-11"],
    ["personnel-14", "agent-12"],
    ["personnel-15", "agent-5"],
    ["personnel-15", "agent-14"],
    ["personnel-16", "agent-3"],
    ["personnel-16", "agent-11"],
    ["personnel-16", "agent-8"]
  ];
  return edges.map((edge, index) => ({
    id: `edge-${index + 1}`,
    fromNodeId: `node-${edge[0]}`,
    toNodeId: `node-${edge[1]}`,
    kind: "personnel-agent" as const
  }));
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

  return {
    nodes,
    edges: buildSeedEdges(),
    overlaysEnabled: false
  };
};

export const seedMaosData = () => {
  const personnel = enrichPersonnel();
  const agents = enrichAgents();
  const mapState = buildSeedMapState(personnel, agents);
  return { personnel, agents, mapState };
};

export const createMaosId = () => createId();

const taskStatusDistribution: TaskStatus[] = ["Backlog", "Backlog", "In Progress", "Blocked", "Done"];
const taskPriorities: Task["priority"][] = ["Low", "Med", "High", "Critical"];
const taskTitles = [
  "Review escalation notes",
  "Prepare weekly cadence brief",
  "Audit workflow handoffs",
  "Update stakeholder dashboard",
  "Triage open queue",
  "Draft status summary",
  "Validate output quality",
  "Resolve blocker dependencies",
  "Optimize routing rules",
  "Finalize close checklist"
];

const createTask = (ownerType: TaskOwnerType, ownerId: string, index: number, seedOffset: number): Task => {
  const createdAt = new Date(Date.now() - (seedOffset + index) * 3600 * 1000).toISOString();
  const status = taskStatusDistribution[(seedOffset + index) % taskStatusDistribution.length];
  return {
    id: createId(),
    title: taskTitles[(seedOffset + index) % taskTitles.length],
    description: "Mock queue task seeded for demo operations.",
    ownerType,
    ownerId,
    priority: taskPriorities[(seedOffset + index) % taskPriorities.length],
    status,
    createdAt,
    updatedAt: createdAt,
    dueDate: new Date(Date.now() + (seedOffset + 2) * 24 * 3600 * 1000).toISOString(),
    tags: status === "Blocked" ? ["dependency", "risk"] : ["queue"]
  };
};

export const seedMaosTasks = (personnel: Personnel[], agents: Agent[]): Task[] => {
  const tasks: Task[] = [];
  personnel.forEach((person, index) => {
    tasks.push(createTask("personnel", person.id, 0, index * 2));
    tasks.push(createTask("personnel", person.id, 1, index * 2));
  });
  agents.forEach((agent, index) => {
    tasks.push(createTask("agent", agent.id, 0, personnel.length * 2 + index * 2));
    tasks.push(createTask("agent", agent.id, 1, personnel.length * 2 + index * 2));
  });
  return tasks;
};
