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
  RoleLevel,
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

// Sales company specific data with hierarchy
const SALES_TEAMS = [
  {
    id: "leadership",
    name: "Leadership",
    color: "#9333ea",
    structure: [
      { role: "CEO", level: "Executive" as RoleLevel, count: 1, supervisorOffset: null },
      { role: "VP of Sales", level: "Executive" as RoleLevel, count: 1, supervisorOffset: 0 },
      { role: "CFO", level: "Executive" as RoleLevel, count: 1, supervisorOffset: 0 },
      { role: "Director of Sales", level: "Director" as RoleLevel, count: 1, supervisorOffset: 1 },
      { role: "Director of HR", level: "Director" as RoleLevel, count: 1, supervisorOffset: 0 },
    ],
    hasLead: false, // No team lead, these ARE the leaders
  },
  {
    id: "admin-orders",
    name: "Admin / Order Writing",
    color: "#3b82f6",
    structure: [
      { role: "Operations Manager", level: "Manager" as RoleLevel, count: 1, supervisorOffset: null }, // Reports to CFO
      { role: "Order Processing Lead", level: "Manager" as RoleLevel, count: 2, supervisorOffset: 0 },
      { role: "Order Processing Specialist", level: "IC" as RoleLevel, count: 10, supervisorOffset: 1 }, // Reports to leads
      { role: "Order Entry Clerk", level: "IC" as RoleLevel, count: 8, supervisorOffset: 1 },
      { role: "Customer Service Rep", level: "IC" as RoleLevel, count: 4, supervisorOffset: 1 },
    ],
    hasLead: true,
    leadIndex: 0, // Operations Manager is the lead
  },
  {
    id: "remote-sales-a",
    name: "Remote Sales Team A",
    color: "#10b981",
    structure: [
      { role: "Sales Manager", level: "Manager" as RoleLevel, count: 1, supervisorOffset: null }, // Reports to Director of Sales
      { role: "Team Lead", level: "Manager" as RoleLevel, count: 2, supervisorOffset: 0 },
      { role: "Account Executive", level: "IC" as RoleLevel, count: 12, supervisorOffset: 1 }, // Reports to team leads
      { role: "Business Development Rep", level: "IC" as RoleLevel, count: 12, supervisorOffset: 1 },
      { role: "Sales Representative", level: "IC" as RoleLevel, count: 8, supervisorOffset: 1 },
    ],
    hasLead: true,
    leadIndex: 0, // Sales Manager is the lead
  },
  {
    id: "remote-sales-b",
    name: "Remote Sales Team B",
    color: "#f59e0b",
    structure: [
      { role: "Sales Manager", level: "Manager" as RoleLevel, count: 1, supervisorOffset: null }, // Reports to Director of Sales
      { role: "Team Lead", level: "Manager" as RoleLevel, count: 2, supervisorOffset: 0 },
      { role: "Account Executive", level: "IC" as RoleLevel, count: 12, supervisorOffset: 1 },
      { role: "Business Development Rep", level: "IC" as RoleLevel, count: 12, supervisorOffset: 1 },
      { role: "Sales Representative", level: "IC" as RoleLevel, count: 8, supervisorOffset: 1 },
    ],
    hasLead: true,
    leadIndex: 0, // Sales Manager is the lead
  },
  {
    id: "physical-sales",
    name: "Physical Location Sales",
    color: "#ec4899",
    structure: [
      { role: "Regional Manager", level: "Manager" as RoleLevel, count: 1, supervisorOffset: null }, // Reports to VP of Sales
      { role: "Store Manager", level: "Manager" as RoleLevel, count: 3, supervisorOffset: 0 },
      { role: "Sales Lead", level: "IC" as RoleLevel, count: 6, supervisorOffset: 1 }, // Reports to store managers
      { role: "Sales Associate", level: "IC" as RoleLevel, count: 7, supervisorOffset: 1 },
      { role: "Customer Success Specialist", level: "IC" as RoleLevel, count: 3, supervisorOffset: 1 },
    ],
    hasLead: true,
    leadIndex: 0, // Regional Manager is the lead
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

  // Generate people across teams with hierarchical relationships
  const people: OrgPerson[] = [];
  let personIndex = 0;

  // Track team leads for department assignment
  const teamLeads: Record<string, string> = {};

  // CEO will be the first person generated (from leadership team)
  let ceoId: string | null = null;
  let vpSalesId: string | null = null;
  let cfoId: string | null = null;
  let directorSalesId: string | null = null;
  let directorHRId: string | null = null;

  SALES_TEAMS.forEach((team) => {
    const teamPeople: OrgPerson[] = [];
    let teamLeadId: string | null = null;

    // Generate people based on structure
    team.structure.forEach((roleSpec, roleIdx) => {
      for (let i = 0; i < roleSpec.count; i++) {
        const firstName = FIRST_NAMES[personIndex % FIRST_NAMES.length];
        const lastNameIdx = Math.floor(personIndex / FIRST_NAMES.length) % LAST_NAMES.length;
        const lastName = LAST_NAMES[(lastNameIdx + hashString(team.id)) % LAST_NAMES.length];
        const name = `${firstName} ${lastName}`;
        const id = `person-${team.id}-${teamPeople.length}`;
        const personRand = seededRandom(hashString(id));

        // Determine supervisor based on structure
        let supervisorId: string | undefined = undefined;

        if (roleSpec.supervisorOffset !== null) {
          // Find supervisor within team
          if (roleSpec.supervisorOffset < teamPeople.length) {
            // For ICs and mid-level managers, find their supervisor within the team
            // For multiple people in same role, distribute them across available supervisors
            const supervisorPool: OrgPerson[] = [];
            for (let j = 0; j < teamPeople.length; j++) {
              const potentialSupervisor = teamPeople[j];
              if (potentialSupervisor.roleLevel === "Manager" || potentialSupervisor.roleLevel === "Director") {
                supervisorPool.push(potentialSupervisor);
              }
            }
            if (supervisorPool.length > 0) {
              supervisorId = supervisorPool[i % supervisorPool.length].id;
            } else if (teamPeople.length > 0) {
              supervisorId = teamPeople[0].id; // Default to team lead
            }
          }
        } else {
          // Top-level role in team - assign to org leadership
          if (team.id === "admin-orders") {
            supervisorId = cfoId || undefined;
          } else if (team.id === "remote-sales-a" || team.id === "remote-sales-b") {
            supervisorId = directorSalesId || undefined;
          } else if (team.id === "physical-sales") {
            supervisorId = vpSalesId || undefined;
          }
        }

        const person: OrgPerson = {
          id,
          name,
          role: roleSpec.role,
          departmentId: team.id,
          presence: pickPresence(personRand),
          leverageScore: Math.floor(personRand() * 100),
          avatarInitials: getInitials(name),
          roleLevel: roleSpec.level,
          supervisorId,
        };

        // Track leadership IDs for cross-team supervisor assignments
        if (team.id === "leadership") {
          if (roleSpec.role === "CEO") ceoId = id;
          else if (roleSpec.role === "VP of Sales") vpSalesId = id;
          else if (roleSpec.role === "CFO") cfoId = id;
          else if (roleSpec.role === "Director of Sales") directorSalesId = id;
          else if (roleSpec.role === "Director of HR") directorHRId = id;
        }

        // Track team lead
        if (team.hasLead && teamPeople.length === team.leadIndex) {
          teamLeadId = id;
        }

        teamPeople.push(person);
        personIndex++;
      }
    });

    // Store team lead for department
    if (teamLeadId) {
      teamLeads[team.id] = teamLeadId;
    }

    people.push(...teamPeople);
  });

  // Second pass: compute direct reports for each person
  const directReportsMap = new Map<string, string[]>();
  people.forEach(person => {
    if (person.supervisorId) {
      const reports = directReportsMap.get(person.supervisorId) || [];
      reports.push(person.id);
      directReportsMap.set(person.supervisorId, reports);
    }
  });

  // Add directReportIds to people
  people.forEach(person => {
    person.directReportIds = directReportsMap.get(person.id) || [];
  });

  // Generate departments/teams with leadUserId
  const departments: OrgDepartment[] = SALES_TEAMS.map((team) => ({
    id: team.id,
    name: team.name,
    color: team.color,
    efficiency: Math.floor(rand() * 30 + 70), // 70-100
    flowHealth: pickFlowHealth(rand),
    activeLoad: Math.floor(rand() * 40 + 10), // 10-50
    leadUserId: teamLeads[team.id],
  }));

  // Generate flow edges (collaboration/reporting)
  const edges: FlowEdge[] = [];

  // Add reports-to edges for all supervisor relationships
  people.forEach(person => {
    if (person.supervisorId) {
      edges.push({
        id: `edge-reports-${person.id}`,
        fromId: person.id,
        toId: person.supervisorId,
        type: "reports-to",
        weight: 0.8,
      });
    }
  });

  // Add some collaboration edges
  const collabCount = Math.min(Math.floor(people.length * 0.15), 150);
  for (let i = 0; i < collabCount; i++) {
    const edgeRand = seededRandom(seed + i * 1000);
    const fromIdx = Math.floor(edgeRand() * people.length);
    const toIdx = Math.floor(edgeRand() * people.length);

    if (fromIdx !== toIdx && people[fromIdx].departmentId !== people[toIdx].departmentId) {
      edges.push({
        id: `edge-collab-${i}`,
        fromId: people[fromIdx].id,
        toId: people[toIdx].id,
        type: "collaborates",
        weight: edgeRand() * 0.5 + 0.2, // 0.2-0.7
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

// Agent mapping: which agents can help with which task types
const AGENT_SUPPORT_MAP: Record<CompanyTaskType, string[]> = {
  Sales: ["agent-sales-ops", "agent-lead-routing", "agent-reporting"],
  OrderWriting: ["agent-sales-ops", "agent-reporting"],
  DisputeResolution: ["agent-ar-followup", "agent-reporting"],
  Admin: ["agent-reporting", "agent-compliance"],
  Other: ["agent-reporting"],
};

// Generate company tasks
export function generateCompanyTasks(orgData: OrgMapData, seed: number = 42): CompanyTask[] {
  const tasks: CompanyTask[] = [];
  const rand = seededRandom(seed);
  const now = new Date();

  // Create lookup maps for denormalization
  const peopleMap = new Map(orgData.people.map(p => [p.id, p]));
  const deptMap = new Map(orgData.departments.map(d => [d.id, d]));

  // Generate 3-7 tasks per person who is not offline
  orgData.people.forEach((person) => {
    if (person.presence === "offline") return;

    const taskCount = Math.floor(rand() * 5) + 3; // 3-7 tasks
    const supervisor = person.supervisorId ? peopleMap.get(person.supervisorId) : undefined;
    const team = deptMap.get(person.departmentId);

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

      // Generate metrics for revenue tasks
      let metrics = undefined;
      if (revenueImpact === "Revenue") {
        if (type === "Sales") {
          metrics = {
            callsMade: Math.floor(taskRand() * 5) + 1,
            salesAmount: Math.floor(taskRand() * 50000) + 5000,
            customerCount: Math.floor(taskRand() * 3) + 1,
          };
        } else if (type === "OrderWriting") {
          metrics = {
            ordersWritten: 1,
            salesAmount: Math.floor(taskRand() * 20000) + 2000,
          };
        } else if (type === "DisputeResolution") {
          metrics = {
            disputeValue: Math.floor(taskRand() * 10000) + 1000,
            customerCount: 1,
          };
        }
      }

      tasks.push({
        id: `task-${person.id}-${i}`,
        title,
        ownerUserId: person.id,
        ownerName: person.name,
        teamId: person.departmentId,
        teamName: team?.name,
        supervisorId: supervisor?.id,
        supervisorName: supervisor?.name,
        type,
        revenueImpact,
        priority,
        status,
        dueDate,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        estimatedEffort: taskRand() < 0.3 ? Math.floor(taskRand() * 8) + 1 : undefined,
        metrics,
        agentSupportIds: AGENT_SUPPORT_MAP[type] || [],
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
