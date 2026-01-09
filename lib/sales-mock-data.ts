import type {
  OrgMapData,
  OrgCore,
  OrgDepartment,
  OrgPerson,
  FlowEdge,
  PersonnelPresence,
  FlowHealth,
  CompanyTask,
  CompanyTaskType,
  CompanyTaskStatus,
  CompanyTaskRevenueImpact,
  CompanyTaskPriority,
  TeamMetrics,
} from "./maos-types";

// Deterministic seeded random number generator
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Hash string to number for deterministic seeding
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function pickPresence(rand: () => number): PersonnelPresence {
  const r = rand();
  if (r < 0.1) return "offline";
  if (r < 0.45) return "online";
  if (r < 0.85) return "active";
  return "blocked";
}

function pickFlowHealth(rand: () => number): FlowHealth {
  const r = rand();
  if (r < 0.65) return "green";
  if (r < 0.9) return "amber";
  return "red";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Sales company specific data
const SALES_TEAMS = [
  {
    id: "leadership",
    name: "Leadership",
    color: "#9333ea",
    roles: [
      "CEO",
      "VP of Sales",
      "CFO",
      "Director of Sales",
      "Director of HR",
    ],
    peopleCount: 5,
  },
  {
    id: "admin-orders",
    name: "Admin / Order Writing",
    color: "#3b82f6",
    roles: [
      "Order Processing Specialist",
      "Order Entry Clerk",
      "Customer Service Rep",
      "Operations Coordinator",
    ],
    peopleCount: 25,
  },
  {
    id: "remote-sales-a",
    name: "Remote Sales Team A",
    color: "#10b981",
    roles: [
      "Sales Representative",
      "Account Executive",
      "Business Development Rep",
      "Sales Manager",
    ],
    peopleCount: 35,
  },
  {
    id: "remote-sales-b",
    name: "Remote Sales Team B",
    color: "#f59e0b",
    roles: [
      "Sales Representative",
      "Account Executive",
      "Business Development Rep",
      "Sales Manager",
    ],
    peopleCount: 35,
  },
  {
    id: "physical-sales",
    name: "Physical Location Sales",
    color: "#ec4899",
    roles: [
      "Sales Associate",
      "Store Manager",
      "Sales Lead",
      "Customer Success Specialist",
    ],
    peopleCount: 20,
  },
];

const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery",
  "Blake", "Cameron", "Drew", "Emery", "Finley", "Gray", "Harper", "Indigo",
  "Jesse", "Kendall", "Lane", "Marley", "Nico", "Oakley", "Parker", "Reese",
  "Sage", "Tatum", "Val", "Winter", "Zion", "Adrian", "Bailey", "Carter",
  "Dakota", "Ellis", "Frankie", "Greer", "Hayden", "Izzy", "Jamie", "Kai",
  "Logan", "Mason", "Noel", "Ollie", "Peyton", "River", "Skyler", "Toby",
  "Sam", "Chris", "Alexis", "Rowan", "Phoenix", "Charlie", "Robin", "Ash",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Roberts", "Carter", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz",
];

// Task templates for different types
const TASK_TEMPLATES: Record<CompanyTaskType, string[]> = {
  Sales: [
    "Call prospect - {company}",
    "Follow up with lead from {source}",
    "Prepare sales presentation for {company}",
    "Close deal with {company}",
    "Discovery call with {company}",
    "Send proposal to {company}",
    "Negotiate contract terms with {company}",
    "Upsell existing customer {company}",
  ],
  OrderWriting: [
    "Process order #{orderNum}",
    "Enter order for {company}",
    "Verify order details for {company}",
    "Coordinate shipping for order #{orderNum}",
    "Update order status #{orderNum}",
    "Follow up on order confirmation with {company}",
  ],
  DisputeResolution: [
    "Resolve billing dispute for {company}",
    "Address delivery issue for order #{orderNum}",
    "Handle customer complaint from {company}",
    "Process refund request for {company}",
    "Escalate issue for {company}",
  ],
  Admin: [
    "Update CRM records",
    "Prepare weekly sales report",
    "Review team metrics",
    "Schedule team meeting",
    "Process expense reports",
    "Update customer database",
  ],
  Other: [
    "Review strategic plan",
    "Attend planning meeting",
    "Conduct team 1:1",
    "Review quarterly objectives",
    "Prepare board presentation",
  ],
};

const COMPANIES = [
  "Acme Corp", "TechStart Inc", "Global Industries", "Premier Solutions",
  "Innovation Labs", "Enterprise Systems", "Digital Ventures", "Alpha Group",
  "Beta Corporation", "Gamma Partners", "Delta Technologies", "Epsilon LLC",
];

const LEAD_SOURCES = ["Website", "Referral", "Cold Call", "LinkedIn", "Conference", "Partner"];

export function generateSalesOrgData(seed: number = 42): OrgMapData {
  const rand = seededRandom(seed);

  // Generate departments/teams
  const departments: OrgDepartment[] = SALES_TEAMS.map((team) => ({
    id: team.id,
    name: team.name,
    color: team.color,
    efficiency: Math.floor(rand() * 30 + 70), // 70-100
    flowHealth: pickFlowHealth(rand),
    activeLoad: Math.floor(rand() * 40 + 10), // 10-50
  }));

  // Generate people across teams
  const people: OrgPerson[] = [];
  let personIndex = 0;

  SALES_TEAMS.forEach((team) => {
    for (let i = 0; i < team.peopleCount; i++) {
      const firstName = FIRST_NAMES[personIndex % FIRST_NAMES.length];
      const lastNameIdx = Math.floor(personIndex / FIRST_NAMES.length) % LAST_NAMES.length;
      const lastName = LAST_NAMES[(lastNameIdx + hashString(team.id)) % LAST_NAMES.length];
      const name = `${firstName} ${lastName}`;
      const id = `person-${team.id}-${i}`;
      const personRand = seededRandom(hashString(id));

      people.push({
        id,
        name,
        role: team.roles[i % team.roles.length],
        departmentId: team.id,
        presence: pickPresence(personRand),
        leverageScore: Math.floor(personRand() * 100),
        avatarInitials: getInitials(name),
      });

      personIndex++;
    }
  });

  // Generate sparse flow edges (collaboration/reporting)
  const edges: FlowEdge[] = [];
  const edgeCount = Math.min(Math.floor(people.length * 0.25), 200);

  for (let i = 0; i < edgeCount; i++) {
    const edgeRand = seededRandom(seed + i * 1000);
    const fromIdx = Math.floor(edgeRand() * people.length);
    const toIdx = Math.floor(edgeRand() * people.length);

    if (fromIdx !== toIdx) {
      const types: FlowEdge["type"][] = ["reports-to", "collaborates", "delegates"];
      edges.push({
        id: `edge-${i}`,
        fromId: people[fromIdx].id,
        toId: people[toIdx].id,
        type: types[Math.floor(edgeRand() * types.length)],
        weight: edgeRand() * 0.7 + 0.3, // 0.3-1.0
      });
    }
  }

  // Calculate org core metrics
  const core: OrgCore = {
    efficiencyScore: Math.round(
      departments.reduce((sum, d) => sum + d.efficiency, 0) / departments.length
    ),
    activeLoad: departments.reduce((sum, d) => sum + d.activeLoad, 0),
    flowHealth: departments.filter((d) => d.flowHealth === "red").length > 1
      ? "red"
      : departments.filter((d) => d.flowHealth === "amber").length > 2
      ? "amber"
      : "green",
  };

  return { core, departments, people, edges };
}

// Generate company tasks
export function generateCompanyTasks(orgData: OrgMapData, seed: number = 42): CompanyTask[] {
  const tasks: CompanyTask[] = [];
  const rand = seededRandom(seed);
  const now = new Date();

  // Generate 3-7 tasks per person who is not offline
  orgData.people.forEach((person) => {
    if (person.presence === "offline") return;

    const taskCount = Math.floor(rand() * 5) + 3; // 3-7 tasks

    for (let i = 0; i < taskCount; i++) {
      const taskRand = seededRandom(hashString(`${person.id}-task-${i}`));

      // Determine task type based on team
      let type: CompanyTaskType;
      let revenueImpact: CompanyTaskRevenueImpact;

      if (person.departmentId === "leadership") {
        type = taskRand() < 0.5 ? "Admin" : "Other";
        revenueImpact = "NonRevenue";
      } else if (person.departmentId === "admin-orders") {
        const r = taskRand();
        if (r < 0.6) {
          type = "OrderWriting";
          revenueImpact = "Revenue";
        } else if (r < 0.8) {
          type = "DisputeResolution";
          revenueImpact = "Revenue";
        } else {
          type = "Admin";
          revenueImpact = "NonRevenue";
        }
      } else {
        // Sales teams
        const r = taskRand();
        if (r < 0.75) {
          type = "Sales";
          revenueImpact = "Revenue";
        } else if (r < 0.85) {
          type = "DisputeResolution";
          revenueImpact = "Revenue";
        } else {
          type = "Admin";
          revenueImpact = "NonRevenue";
        }
      }

      // Pick template and fill in variables
      const templates = TASK_TEMPLATES[type] || TASK_TEMPLATES.Admin;
      const template = templates[Math.floor(taskRand() * templates.length)];
      const company = COMPANIES[Math.floor(taskRand() * COMPANIES.length)];
      const source = LEAD_SOURCES[Math.floor(taskRand() * LEAD_SOURCES.length)];
      const orderNum = Math.floor(taskRand() * 90000) + 10000;

      const title = template
        .replace("{company}", company)
        .replace("{source}", source)
        .replace("{orderNum}", orderNum.toString());

      // Determine status
      let status: CompanyTaskStatus;
      const statusRand = taskRand();
      if (statusRand < 0.3) status = "Planned";
      else if (statusRand < 0.6) status = "InProgress";
      else if (statusRand < 0.9) status = "Done";
      else status = "Blocked";

      // Determine priority
      const priorities: CompanyTaskPriority[] = ["P1", "P2", "P3"];
      const priorityWeights = [0.2, 0.5, 0.3]; // More P2 tasks
      const priorityRand = taskRand();
      let priority: CompanyTaskPriority = "P2";
      if (priorityRand < priorityWeights[0]) priority = "P1";
      else if (priorityRand < priorityWeights[0] + priorityWeights[1]) priority = "P2";
      else priority = "P3";

      // Create timestamps
      const createdDaysAgo = Math.floor(taskRand() * 14); // 0-14 days ago
      const createdAt = new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(createdAt.getTime() + Math.floor(taskRand() * createdDaysAgo * 24 * 60 * 60 * 1000));

      // Due date (50% of tasks have one)
      let dueDate: string | undefined;
      if (taskRand() < 0.5) {
        const dueDaysFromNow = Math.floor(taskRand() * 14) - 3; // -3 to +11 days
        const dueDateObj = new Date(now.getTime() + dueDaysFromNow * 24 * 60 * 60 * 1000);
        dueDate = dueDateObj.toISOString().split("T")[0];
      }

      tasks.push({
        id: `task-${person.id}-${i}`,
        title,
        ownerUserId: person.id,
        teamId: person.departmentId,
        type,
        revenueImpact,
        priority,
        status,
        dueDate,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        estimatedEffort: taskRand() < 0.3 ? Math.floor(taskRand() * 8) + 1 : undefined,
      });
    }
  });

  return tasks;
}

// Generate team metrics
export function generateTeamMetrics(orgData: OrgMapData, seed: number = 42): TeamMetrics[] {
  const rand = seededRandom(seed);

  return orgData.departments.map((dept) => {
    const metrics: TeamMetrics = {
      teamId: dept.id,
    };

    if (dept.id === "admin-orders") {
      metrics.ordersWritten = Math.floor(rand() * 50) + 20; // 20-70 orders today
    } else if (dept.id.includes("sales") || dept.id === "physical-sales") {
      metrics.totalCalls = Math.floor(rand() * 100) + 50; // 50-150 calls
      metrics.customersReached = Math.floor(rand() * 40) + 20; // 20-60 reached
      metrics.totalSales = Math.floor(rand() * 30) + 10; // 10-40 sales
    }

    return metrics;
  });
}

// Pre-generated data for immediate use
export const salesOrgData = generateSalesOrgData(42);
export const companyTasks = generateCompanyTasks(salesOrgData, 42);
export const teamMetrics = generateTeamMetrics(salesOrgData, 42);

// Helper functions for task filtering and querying
export function getTasksByTeam(teamId: string): CompanyTask[] {
  return companyTasks.filter((task) => task.teamId === teamId);
}

export function getTasksByPerson(personId: string): CompanyTask[] {
  return companyTasks.filter((task) => task.ownerUserId === personId);
}

export function getTodaysTasks(): CompanyTask[] {
  const today = new Date().toISOString().split("T")[0];
  return companyTasks.filter(
    (task) =>
      task.status === "Planned" ||
      task.status === "InProgress" ||
      (task.dueDate && task.dueDate === today)
  );
}

export function getRevenueTasks(): CompanyTask[] {
  return companyTasks.filter((task) => task.revenueImpact === "Revenue");
}

export function getBlockedTasks(): CompanyTask[] {
  return companyTasks.filter((task) => task.status === "Blocked");
}

export function getTaskSummary() {
  const today = new Date().toISOString().split("T")[0];
  const todaysTasks = getTodaysTasks();
  const revenueTasks = getRevenueTasks();

  return {
    totalTasks: companyTasks.length,
    todayPlanned: todaysTasks.filter((t) => t.status === "Planned").length,
    todayInProgress: todaysTasks.filter((t) => t.status === "InProgress").length,
    todayBlocked: todaysTasks.filter((t) => t.status === "Blocked").length,
    revenuePlanned: revenueTasks.filter((t) => t.status === "Planned").length,
    revenueInProgress: revenueTasks.filter((t) => t.status === "InProgress").length,
    revenueBlocked: revenueTasks.filter((t) => t.status === "Blocked").length,
    disputeResolution: companyTasks.filter((t) => t.type === "DisputeResolution" && t.status !== "Done").length,
    ordersWrittenToday: teamMetrics.find((m) => m.teamId === "admin-orders")?.ordersWritten || 0,
    totalCallsToday: teamMetrics
      .filter((m) => m.totalCalls)
      .reduce((sum, m) => sum + (m.totalCalls || 0), 0),
    customersReachedToday: teamMetrics
      .filter((m) => m.customersReached)
      .reduce((sum, m) => sum + (m.customersReached || 0), 0),
    salesToday: teamMetrics
      .filter((m) => m.totalSales)
      .reduce((sum, m) => sum + (m.totalSales || 0), 0),
  };
}
