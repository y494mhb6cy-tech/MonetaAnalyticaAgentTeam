"use client";

export type Team = "Sales" | "Ops" | "Finance" | "HR" | "Exec";

export type PersonnelStatus = "Active" | "In Focus" | "Overloaded" | "Idle" | "Out";

export type CapacityLevel = "Overloaded" | "At Capacity" | "Balanced" | "Available";

export type PersonnelMetrics = {
  callsToday?: number;
  callsWeek?: number;
  salesToday?: number;
  salesWeek?: number;
  revenueWeek?: number;
  jobsScheduledToday?: number;
  jobsCompletedToday?: number;
  backlog?: number;
  overtimeHoursWeek?: number;
  invoicesProcessedToday?: number;
  arCallsWeek?: number;
  closeTasksOpen?: number;
  daysToCloseEstimate?: number;
};

export type PersonnelRaciTask = {
  task: string;
  role: "R" | "A" | "C" | "I";
  partner?: string;
};

export type PersonnelProfile = {
  id: string;
  name: string;
  title: string;
  level: string;
  team: Team;
  status: PersonnelStatus;
  capacity: CapacityLevel;
  responsibilities: string[];
  tasks: PersonnelRaciTask[];
  metrics: PersonnelMetrics;
};

export type AgentHealth = "Healthy" | "Degraded" | "Investigating";

export type AgentProfile = {
  id: string;
  name: string;
  module: string;
  purpose: string;
  ownerTeam: Team;
  inputs: string[];
  outputs: string[];
  runsToday: number;
  runsWeek: number;
  avgLatencyMs: number;
  successRate: number;
  errorRate: number;
  lastRunAt: string;
  health: AgentHealth;
};

export type DemoEdge = {
  id: string;
  personnelId: string;
  agentId: string;
  relationship: string;
};

export type DemoData = {
  personnel: PersonnelProfile[];
  agents: AgentProfile[];
  edges: DemoEdge[];
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
  personnel: PersonnelProfile[];
  agents: AgentProfile[];
  nodes: MapNode[];
  edges: MapEdge[];
};

const DEMO_VERSION = "v3";
const DEMO_STORAGE_KEY = `maos_demo_data_${DEMO_VERSION}`;
const MAP_STORAGE_KEY = `maos_map_state_${DEMO_VERSION}`;
const RNG_SEED = 42;

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const randInt = (rand: () => number, min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;

const randFloat = (rand: () => number, min: number, max: number, digits = 2) =>
  Number((rand() * (max - min) + min).toFixed(digits));

const pick = <T,>(rand: () => number, options: T[]) => options[Math.floor(rand() * options.length)];

type PersonnelSeed = Omit<PersonnelProfile, "status" | "capacity" | "metrics">;

const buildPersonnelSeed = (): PersonnelSeed[] => [
  {
    id: "person-elena",
    name: "Elena Park",
    title: "Chief of Staff",
    level: "Executive",
    team: "Exec" as Team,
    responsibilities: ["Executive rhythm", "Cross-team alignment", "Board prep"],
    tasks: [
      { task: "Quarterly leadership offsite", role: "A", partner: "CEO" },
      { task: "Weekly KPI readout", role: "R", partner: "FP&A" },
      { task: "Priority intake triage", role: "C", partner: "Ops" }
    ]
  },
  {
    id: "person-marcus",
    name: "Marcus Reed",
    title: "VP of Sales",
    level: "Executive",
    team: "Sales" as Team,
    responsibilities: ["Pipeline coverage", "Revenue execution", "Enterprise deals"],
    tasks: [
      { task: "Enterprise deal reviews", role: "A", partner: "AE Leads" },
      { task: "Weekly pipeline standup", role: "R", partner: "Sales Ops" },
      { task: "Comp plan governance", role: "C", partner: "Finance" }
    ]
  },
  {
    id: "person-talia",
    name: "Talia Brooks",
    title: "Director, Sales Operations",
    level: "Director",
    team: "Sales" as Team,
    responsibilities: ["Territory design", "CRM hygiene", "Forecast cadence"],
    tasks: [
      { task: "Territory realignment", role: "R", partner: "VP Sales" },
      { task: "Forecast lock", role: "A", partner: "Finance" },
      { task: "CRM governance", role: "C", partner: "RevOps" }
    ]
  },
  {
    id: "person-ian",
    name: "Ian Chu",
    title: "Enterprise Account Executive",
    level: "Senior IC",
    team: "Sales" as Team,
    responsibilities: ["Strategic accounts", "Expansion motions", "Partner co-sell"],
    tasks: [
      { task: "Account expansion plans", role: "R", partner: "CS" },
      { task: "QBR delivery", role: "A", partner: "Account Team" },
      { task: "Pipeline hygiene", role: "C", partner: "Sales Ops" }
    ]
  },
  {
    id: "person-sofia",
    name: "Sofia Alvarez",
    title: "SDR Lead",
    level: "Manager",
    team: "Sales" as Team,
    responsibilities: ["Inbound routing", "Outbound cadence", "Enablement"],
    tasks: [
      { task: "Inbound lead SLA", role: "A", partner: "Marketing" },
      { task: "Outbound sequencing", role: "R", partner: "SDRs" },
      { task: "Messaging updates", role: "C", partner: "Product" }
    ]
  },
  {
    id: "person-jamal",
    name: "Jamal Wright",
    title: "Sales Analyst",
    level: "IC",
    team: "Sales" as Team,
    responsibilities: ["Deal inspection", "Pricing insights", "Win/loss"],
    tasks: [
      { task: "Weekly win/loss", role: "R", partner: "Sales Ops" },
      { task: "Deal desk analysis", role: "C", partner: "Finance" },
      { task: "Pricing exception log", role: "I", partner: "Legal" }
    ]
  },
  {
    id: "person-priya",
    name: "Priya Desai",
    title: "Controller",
    level: "Director",
    team: "Finance" as Team,
    responsibilities: ["Month-end close", "Controls", "Policy compliance"],
    tasks: [
      { task: "Close calendar", role: "A", partner: "Accounting" },
      { task: "Variance commentary", role: "R", partner: "FP&A" },
      { task: "SOX walkthrough", role: "C", partner: "Audit" }
    ]
  },
  {
    id: "person-hana",
    name: "Hana Kim",
    title: "FP&A Manager",
    level: "Manager",
    team: "Finance" as Team,
    responsibilities: ["Forecast accuracy", "Scenario modeling", "Exec reporting"],
    tasks: [
      { task: "Rolling forecast", role: "R", partner: "Business Owners" },
      { task: "Headcount plan", role: "C", partner: "HR" },
      { task: "Board deck narrative", role: "A", partner: "CFO" }
    ]
  },
  {
    id: "person-gabriel",
    name: "Gabriel Stone",
    title: "AR Manager",
    level: "Manager",
    team: "Finance" as Team,
    responsibilities: ["Collections cadence", "Aging exposure", "Credit risk"],
    tasks: [
      { task: "Collections escalation", role: "A", partner: "Sales" },
      { task: "Aging remediation", role: "R", partner: "AR Analysts" },
      { task: "Credit memo review", role: "C", partner: "Legal" }
    ]
  },
  {
    id: "person-chen",
    name: "Chen Wu",
    title: "AP Specialist",
    level: "IC",
    team: "Finance" as Team,
    responsibilities: ["Invoice intake", "Vendor payments", "Discrepancy resolution"],
    tasks: [
      { task: "Invoice batching", role: "R", partner: "AP" },
      { task: "Vendor dispute log", role: "C", partner: "Ops" },
      { task: "Payment forecast", role: "I", partner: "Treasury" }
    ]
  },
  {
    id: "person-lila",
    name: "Lila Hassan",
    title: "Director of Operations",
    level: "Director",
    team: "Ops" as Team,
    responsibilities: ["Service delivery", "Backlog control", "Field readiness"],
    tasks: [
      { task: "Backlog burn plan", role: "A", partner: "Schedulers" },
      { task: "Weekly ops review", role: "R", partner: "Ops Leads" },
      { task: "Escalation routing", role: "C", partner: "Support" }
    ]
  },
  {
    id: "person-noah",
    name: "Noah Patel",
    title: "Scheduling Supervisor",
    level: "Manager",
    team: "Ops" as Team,
    responsibilities: ["Route optimization", "On-time performance", "Field coverage"],
    tasks: [
      { task: "Daily dispatch board", role: "R", partner: "Dispatch" },
      { task: "Route optimization", role: "A", partner: "Field Ops" },
      { task: "Capacity alerts", role: "C", partner: "Finance" }
    ]
  },
  {
    id: "person-erin",
    name: "Erin Walsh",
    title: "QA Manager",
    level: "Manager",
    team: "Ops" as Team,
    responsibilities: ["Quality audits", "Root-cause analysis", "Corrective action"],
    tasks: [
      { task: "QA sampling plan", role: "A", partner: "Ops" },
      { task: "Corrective action log", role: "R", partner: "Field Leads" },
      { task: "Compliance reporting", role: "C", partner: "Legal" }
    ]
  },
  {
    id: "person-olivia",
    name: "Olivia Grant",
    title: "HR Business Partner",
    level: "Senior IC",
    team: "HR" as Team,
    responsibilities: ["Manager coaching", "Org health", "Employee relations"],
    tasks: [
      { task: "Manager intake", role: "R", partner: "People Ops" },
      { task: "Performance calibrations", role: "C", partner: "Exec" },
      { task: "Retention risk review", role: "A", partner: "People Analytics" }
    ]
  },
  {
    id: "person-lucas",
    name: "Lucas Meyer",
    title: "People Ops Manager",
    level: "Manager",
    team: "HR" as Team,
    responsibilities: ["Onboarding", "Policy updates", "Workforce planning"],
    tasks: [
      { task: "Onboarding cohorts", role: "A", partner: "HR" },
      { task: "Policy refresh", role: "R", partner: "Legal" },
      { task: "Workforce plan", role: "C", partner: "Finance" }
    ]
  }
];

const buildAgentSeed = () => [
  {
    id: "agent-lead-router",
    name: "Lead Router Agent",
    module: "Lead Routing",
    purpose: "Routes inbound leads to the right SDR within SLA.",
    ownerTeam: "Sales" as Team,
    inputs: ["Inbound forms", "Territory rules", "Account tier"],
    outputs: ["Assigned owner", "Lead SLA timestamp"]
  },
  {
    id: "agent-script-coach",
    name: "Script Coach Agent",
    module: "Sales Ops",
    purpose: "Scores call transcripts and recommends talk tracks.",
    ownerTeam: "Sales" as Team,
    inputs: ["Call recordings", "Win/loss notes"],
    outputs: ["Coaching tips", "Rep scorecard"]
  },
  {
    id: "agent-pipeline-hygiene",
    name: "Pipeline Hygiene Agent",
    module: "Sales Ops",
    purpose: "Flags stale opportunities and missing next steps.",
    ownerTeam: "Sales" as Team,
    inputs: ["CRM stages", "Next step dates"],
    outputs: ["Stale opp list", "Update reminders"]
  },
  {
    id: "agent-renewal-risk",
    name: "Renewal Risk Agent",
    module: "Reporting",
    purpose: "Identifies renewals at risk based on usage signals.",
    ownerTeam: "Sales" as Team,
    inputs: ["Usage logs", "CS sentiment"],
    outputs: ["Risk score", "Action queue"]
  },
  {
    id: "agent-scheduling-optimizer",
    name: "Scheduling Optimizer Agent",
    module: "Scheduling",
    purpose: "Optimizes technician schedules based on priority and geography.",
    ownerTeam: "Ops" as Team,
    inputs: ["Work orders", "Technician locations"],
    outputs: ["Optimized routes", "Schedule exceptions"]
  },
  {
    id: "agent-field-dispatch",
    name: "Field Dispatch Agent",
    module: "Scheduling",
    purpose: "Auto-dispatches high-priority jobs and updates ETAs.",
    ownerTeam: "Ops" as Team,
    inputs: ["Backlog queue", "SLA targets"],
    outputs: ["Dispatch confirmations", "ETA alerts"]
  },
  {
    id: "agent-qa-sweep",
    name: "QA Sweep Agent",
    module: "QA",
    purpose: "Runs daily QA checks and flags repeat issues.",
    ownerTeam: "Ops" as Team,
    inputs: ["Inspection logs", "Customer feedback"],
    outputs: ["QA findings", "Root-cause tags"]
  },
  {
    id: "agent-compliance-watch",
    name: "Compliance Watch Agent",
    module: "Compliance",
    purpose: "Monitors policy compliance across operational workflows.",
    ownerTeam: "Ops" as Team,
    inputs: ["Audit logs", "Policy checklists"],
    outputs: ["Compliance alerts", "Escalation tickets"]
  },
  {
    id: "agent-ledger-close",
    name: "Ledger Close Agent",
    module: "Ledger Close",
    purpose: "Automates close checklists and variance gathering.",
    ownerTeam: "Finance" as Team,
    inputs: ["Trial balance", "Subledger extracts"],
    outputs: ["Close tracker", "Variance packets"]
  },
  {
    id: "agent-variance-explainer",
    name: "Variance Explanation Agent",
    module: "Reporting",
    purpose: "Drafts variance narratives for exec readouts.",
    ownerTeam: "Finance" as Team,
    inputs: ["Budget vs actuals", "KPI deltas"],
    outputs: ["Narrative summary", "Risk flags"]
  },
  {
    id: "agent-ar-followup",
    name: "AR Follow-up Agent",
    module: "AR Follow-up",
    purpose: "Schedules touchpoints for past due accounts.",
    ownerTeam: "Finance" as Team,
    inputs: ["Aging report", "Customer notes"],
    outputs: ["Follow-up tasks", "Promise-to-pay log"]
  },
  {
    id: "agent-collections-prioritizer",
    name: "Collections Prioritizer Agent",
    module: "AR Follow-up",
    purpose: "Ranks delinquent accounts by exposure and risk.",
    ownerTeam: "Finance" as Team,
    inputs: ["A/R aging", "Credit score"],
    outputs: ["Priority list", "Escalation triggers"]
  },
  {
    id: "agent-cash-forecast",
    name: "Cash Forecast Agent",
    module: "Reporting",
    purpose: "Updates weekly cash forecast with live signals.",
    ownerTeam: "Finance" as Team,
    inputs: ["Bank feeds", "Forecast drivers"],
    outputs: ["Cash forecast", "Variance alerts"]
  },
  {
    id: "agent-rev-rec",
    name: "Revenue Recognition Agent",
    module: "Compliance",
    purpose: "Checks revenue recognition rules and exceptions.",
    ownerTeam: "Finance" as Team,
    inputs: ["Contracts", "Delivery milestones"],
    outputs: ["Rev rec schedule", "Exception log"]
  },
  {
    id: "agent-ops-backlog",
    name: "Ops Backlog Triage Agent",
    module: "Reporting",
    purpose: "Surfaces backlog hotspots and aging risk.",
    ownerTeam: "Ops" as Team,
    inputs: ["Work order backlog", "SLA timers"],
    outputs: ["Backlog heatmap", "Escalation list"]
  },
  {
    id: "agent-workforce-capacity",
    name: "Workforce Capacity Agent",
    module: "Reporting",
    purpose: "Monitors capacity by team and flags overload.",
    ownerTeam: "HR" as Team,
    inputs: ["Timesheets", "Headcount plan"],
    outputs: ["Capacity dashboard", "Hiring recommendations"]
  },
  {
    id: "agent-training-scheduler",
    name: "Training Scheduler Agent",
    module: "Scheduling",
    purpose: "Coordinates onboarding sessions and training slots.",
    ownerTeam: "HR" as Team,
    inputs: ["Trainer calendars", "New hire roster"],
    outputs: ["Training schedule", "Attendance reminders"]
  },
  {
    id: "agent-quality-audit",
    name: "Quality Audit Agent",
    module: "QA",
    purpose: "Randomly samples completed jobs for QA scoring.",
    ownerTeam: "Ops" as Team,
    inputs: ["Completed job logs", "Customer satisfaction"],
    outputs: ["QA scorecards", "Issue tickets"]
  }
];

const buildRelationships = (): DemoEdge[] => [
  { id: "edge-1", personnelId: "person-marcus", agentId: "agent-lead-router", relationship: "relies on" },
  { id: "edge-2", personnelId: "person-marcus", agentId: "agent-renewal-risk", relationship: "reviews" },
  { id: "edge-3", personnelId: "person-talia", agentId: "agent-pipeline-hygiene", relationship: "maintains" },
  { id: "edge-4", personnelId: "person-talia", agentId: "agent-script-coach", relationship: "deploys" },
  { id: "edge-5", personnelId: "person-ian", agentId: "agent-script-coach", relationship: "uses" },
  { id: "edge-6", personnelId: "person-ian", agentId: "agent-pipeline-hygiene", relationship: "updates" },
  { id: "edge-7", personnelId: "person-sofia", agentId: "agent-lead-router", relationship: "depends on" },
  { id: "edge-8", personnelId: "person-sofia", agentId: "agent-scheduling-optimizer", relationship: "coordinates" },
  { id: "edge-9", personnelId: "person-jamal", agentId: "agent-renewal-risk", relationship: "monitors" },
  { id: "edge-10", personnelId: "person-jamal", agentId: "agent-pipeline-hygiene", relationship: "audits" },
  { id: "edge-11", personnelId: "person-priya", agentId: "agent-ledger-close", relationship: "oversees" },
  { id: "edge-12", personnelId: "person-priya", agentId: "agent-variance-explainer", relationship: "approves" },
  { id: "edge-13", personnelId: "person-priya", agentId: "agent-rev-rec", relationship: "governs" },
  { id: "edge-14", personnelId: "person-hana", agentId: "agent-cash-forecast", relationship: "publishes" },
  { id: "edge-15", personnelId: "person-hana", agentId: "agent-variance-explainer", relationship: "uses" },
  { id: "edge-16", personnelId: "person-gabriel", agentId: "agent-ar-followup", relationship: "operates" },
  { id: "edge-17", personnelId: "person-gabriel", agentId: "agent-collections-prioritizer", relationship: "prioritizes" },
  { id: "edge-18", personnelId: "person-chen", agentId: "agent-ledger-close", relationship: "feeds" },
  { id: "edge-19", personnelId: "person-chen", agentId: "agent-rev-rec", relationship: "checks" },
  { id: "edge-20", personnelId: "person-lila", agentId: "agent-ops-backlog", relationship: "reviews" },
  { id: "edge-21", personnelId: "person-lila", agentId: "agent-compliance-watch", relationship: "tracks" },
  { id: "edge-22", personnelId: "person-noah", agentId: "agent-scheduling-optimizer", relationship: "runs" },
  { id: "edge-23", personnelId: "person-noah", agentId: "agent-field-dispatch", relationship: "dispatches" },
  { id: "edge-24", personnelId: "person-erin", agentId: "agent-qa-sweep", relationship: "validates" },
  { id: "edge-25", personnelId: "person-erin", agentId: "agent-quality-audit", relationship: "scores" },
  { id: "edge-26", personnelId: "person-olivia", agentId: "agent-workforce-capacity", relationship: "uses" },
  { id: "edge-27", personnelId: "person-olivia", agentId: "agent-training-scheduler", relationship: "coordinates" },
  { id: "edge-28", personnelId: "person-lucas", agentId: "agent-training-scheduler", relationship: "owns" },
  { id: "edge-29", personnelId: "person-lucas", agentId: "agent-workforce-capacity", relationship: "reviews" },
  { id: "edge-30", personnelId: "person-elena", agentId: "agent-variance-explainer", relationship: "reads" },
  { id: "edge-31", personnelId: "person-elena", agentId: "agent-ops-backlog", relationship: "tracks" },
  { id: "edge-32", personnelId: "person-marcus", agentId: "agent-script-coach", relationship: "sponsors" },
  { id: "edge-33", personnelId: "person-priya", agentId: "agent-cash-forecast", relationship: "approves" }
];

const buildPersonnel = (seed: number) => {
  const base = buildPersonnelSeed();
  return base.map((person, index) => {
    const rand = mulberry32(seed + index * 7);
    const status = pick(rand, ["Active", "In Focus", "Overloaded", "Idle"] as PersonnelStatus[]);
    const capacity = pick(rand, ["Overloaded", "At Capacity", "Balanced", "Available"] as CapacityLevel[]);
    const metrics: PersonnelMetrics = {};

    if (person.team === "Sales") {
      metrics.callsToday = randInt(rand, 14, 42);
      metrics.callsWeek = randInt(rand, 160, 420);
      metrics.salesToday = randInt(rand, 1, 6);
      metrics.salesWeek = randInt(rand, 6, 24);
      metrics.revenueWeek = randInt(rand, 120000, 520000);
    }

    if (person.team === "Ops") {
      metrics.jobsScheduledToday = randInt(rand, 18, 64);
      metrics.jobsCompletedToday = randInt(rand, 12, 58);
      metrics.backlog = randInt(rand, 24, 140);
      metrics.overtimeHoursWeek = randInt(rand, 2, 18);
    }

    if (person.team === "Finance") {
      metrics.invoicesProcessedToday = randInt(rand, 18, 95);
      metrics.arCallsWeek = randInt(rand, 20, 110);
      metrics.closeTasksOpen = randInt(rand, 6, 18);
      metrics.daysToCloseEstimate = randInt(rand, 3, 7);
    }

    return {
      ...person,
      status,
      capacity,
      metrics
    } satisfies PersonnelProfile;
  });
};

const buildAgents = (seed: number) => {
  const base = buildAgentSeed();
  return base.map((agent, index) => {
    const rand = mulberry32(seed + index * 11);
    const successRate = randFloat(rand, 0.91, 0.995, 3);
    const errorRate = randFloat(rand, 0.2, 5.5, 2);
    const health = successRate < 0.94 ? "Degraded" : successRate < 0.965 ? "Investigating" : "Healthy";
    const lastRunAt = new Date(Date.UTC(2024, 4, 6, 14, randInt(rand, 2, 58))).toISOString();

    return {
      ...agent,
      runsToday: randInt(rand, 4, 48),
      runsWeek: randInt(rand, 60, 320),
      avgLatencyMs: randInt(rand, 420, 1680),
      successRate,
      errorRate,
      lastRunAt,
      health
    } satisfies AgentProfile;
  });
};

export const seedDemoData = (): DemoData => {
  const personnel = buildPersonnel(RNG_SEED);
  const agents = buildAgents(RNG_SEED + 13);
  const edges = buildRelationships();
  return { personnel, agents, edges };
};

export const getDemoData = (): DemoData => {
  if (typeof window === "undefined") {
    return seedDemoData();
  }
  const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as DemoData;
    } catch {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  }
  const seeded = seedDemoData();
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

const buildNodes = (data: DemoData): MapNode[] => {
  const items = [
    ...data.personnel.map((person) => ({ kind: "personnel" as const, refId: person.id })),
    ...data.agents.map((agent) => ({ kind: "agent" as const, refId: agent.id }))
  ];
  const columns = 5;
  const spacingX = 240;
  const spacingY = 170;
  const offsetX = 120;
  const offsetY = 120;

  return items.map((item, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    return {
      id: `node-${item.kind}-${item.refId}`,
      kind: item.kind,
      refId: item.refId,
      position: {
        x: offsetX + col * spacingX,
        y: offsetY + row * spacingY
      }
    } satisfies MapNode;
  });
};

const buildMapEdges = (data: DemoData, nodes: MapNode[]): MapEdge[] => {
  const nodeByRef = new Map(nodes.map((node) => [node.refId, node]));
  return data.edges
    .map((edge) => {
      const fromNode = nodeByRef.get(edge.personnelId);
      const toNode = nodeByRef.get(edge.agentId);
      if (!fromNode || !toNode) {
        return null;
      }
      return {
        id: `edge-${edge.personnelId}-${edge.agentId}`,
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        kind: "personnel-agent"
      } satisfies MapEdge;
    })
    .filter((edge): edge is MapEdge => edge !== null);
};

export const seedMapState = (data: DemoData): MapState => {
  const nodes = buildNodes(data);
  return {
    personnel: data.personnel,
    agents: data.agents,
    nodes,
    edges: buildMapEdges(data, nodes)
  };
};

export const getMapState = (): MapState => {
  if (typeof window === "undefined") {
    return seedMapState(seedDemoData());
  }
  const stored = window.localStorage.getItem(MAP_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as MapState;
    } catch {
      window.localStorage.removeItem(MAP_STORAGE_KEY);
    }
  }
  const data = getDemoData();
  const seeded = seedMapState(data);
  window.localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

export const saveMapState = (state: MapState) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(state));
};

export const resetDemoData = () => {
  if (typeof window === "undefined") {
    return seedDemoData();
  }
  window.localStorage.removeItem(DEMO_STORAGE_KEY);
  window.localStorage.removeItem(MAP_STORAGE_KEY);
  const seeded = seedDemoData();
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seeded));
  const seededMap = seedMapState(seeded);
  window.localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(seededMap));
  return seeded;
};

export const demoStorageKeys = {
  demo: DEMO_STORAGE_KEY,
  map: MAP_STORAGE_KEY
};
