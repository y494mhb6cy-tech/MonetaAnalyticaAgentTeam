import type {
  OrgMapData,
  OrgCore,
  OrgDepartment,
  OrgPerson,
  FlowEdge,
  PersonnelPresence,
  FlowHealth,
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

const DEPARTMENT_CONFIGS: Omit<OrgDepartment, "efficiency" | "flowHealth" | "activeLoad">[] = [
  { id: "exec", name: "Executive", color: "#9333ea" },
  { id: "sales", name: "Sales", color: "#3b82f6" },
  { id: "finance", name: "Finance", color: "#10b981" },
  { id: "ops", name: "Operations", color: "#f59e0b" },
  { id: "hr", name: "HR", color: "#ec4899" },
  { id: "engineering", name: "Engineering", color: "#06b6d4" },
  { id: "marketing", name: "Marketing", color: "#8b5cf6" },
  { id: "product", name: "Product", color: "#f97316" },
];

const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery",
  "Blake", "Cameron", "Drew", "Emery", "Finley", "Gray", "Harper", "Indigo",
  "Jesse", "Kendall", "Lane", "Marley", "Nico", "Oakley", "Parker", "Reese",
  "Sage", "Tatum", "Val", "Winter", "Zion", "Adrian", "Bailey", "Carter",
  "Dakota", "Ellis", "Frankie", "Greer", "Hayden", "Izzy", "Jamie", "Kai",
  "Logan", "Mason", "Noel", "Ollie", "Peyton", "River", "Skyler", "Toby",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
];

const ROLES_BY_DEPARTMENT: Record<string, string[]> = {
  exec: ["CEO", "COO", "CFO", "CTO", "CMO", "Chief Strategy Officer"],
  sales: ["Sales Rep", "Account Executive", "Sales Manager", "BDR", "Sales Director", "VP Sales"],
  finance: ["Accountant", "Financial Analyst", "Controller", "AP Specialist", "AR Specialist", "FP&A Manager"],
  ops: ["Operations Manager", "Process Analyst", "Supply Chain Lead", "Logistics Coordinator", "QA Specialist"],
  hr: ["HR Generalist", "Recruiter", "HR Manager", "Benefits Coordinator", "Talent Partner", "HRBP"],
  engineering: ["Software Engineer", "Senior Engineer", "Tech Lead", "Staff Engineer", "Engineering Manager"],
  marketing: ["Marketing Manager", "Content Strategist", "Growth Lead", "Brand Manager", "Demand Gen"],
  product: ["Product Manager", "Senior PM", "Product Designer", "UX Researcher", "Product Director"],
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function pickPresence(rand: () => number): PersonnelPresence {
  const r = rand();
  if (r < 0.15) return "offline";
  if (r < 0.5) return "online";
  if (r < 0.85) return "active";
  return "blocked";
}

function pickFlowHealth(rand: () => number): FlowHealth {
  const r = rand();
  if (r < 0.6) return "green";
  if (r < 0.9) return "amber";
  return "red";
}

export function generateOrgMapData(peopleCount: number = 100, seed: number = 42): OrgMapData {
  const rand = seededRandom(seed);

  // Generate departments with metrics
  const departments: OrgDepartment[] = DEPARTMENT_CONFIGS.map((config) => ({
    ...config,
    efficiency: Math.floor(rand() * 40 + 60), // 60-100
    flowHealth: pickFlowHealth(rand),
    activeLoad: Math.floor(rand() * 50 + 5), // 5-55
  }));

  // Calculate how many people per department
  const peoplePerDept = Math.floor(peopleCount / departments.length);
  const remainder = peopleCount % departments.length;

  // Generate people
  const people: OrgPerson[] = [];
  let personIndex = 0;

  departments.forEach((dept, deptIdx) => {
    const deptPeopleCount = peoplePerDept + (deptIdx < remainder ? 1 : 0);
    const roles = ROLES_BY_DEPARTMENT[dept.id] || ["Specialist"];

    for (let i = 0; i < deptPeopleCount; i++) {
      const firstName = FIRST_NAMES[personIndex % FIRST_NAMES.length];
      const lastNameIdx = Math.floor(personIndex / FIRST_NAMES.length) % LAST_NAMES.length;
      const lastName = LAST_NAMES[(lastNameIdx + hashString(dept.id)) % LAST_NAMES.length];
      const name = `${firstName} ${lastName}`;
      const id = `person-${dept.id}-${i}`;
      const personRand = seededRandom(hashString(id));

      people.push({
        id,
        name,
        role: roles[i % roles.length],
        departmentId: dept.id,
        presence: pickPresence(personRand),
        leverageScore: Math.floor(personRand() * 100),
        avatarInitials: getInitials(name),
      });

      personIndex++;
    }
  });

  // Generate some flow edges (sparse - only for overlay)
  const edges: FlowEdge[] = [];
  const edgeCount = Math.min(Math.floor(peopleCount * 0.3), 300); // ~30% connections, max 300

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
        weight: edgeRand() * 0.8 + 0.2, // 0.2-1.0
      });
    }
  }

  // Calculate org core metrics
  const core: OrgCore = {
    efficiencyScore: Math.round(
      departments.reduce((sum, d) => sum + d.efficiency, 0) / departments.length
    ),
    activeLoad: departments.reduce((sum, d) => sum + d.activeLoad, 0),
    flowHealth: departments.filter((d) => d.flowHealth === "red").length > 2
      ? "red"
      : departments.filter((d) => d.flowHealth === "amber").length > 3
      ? "amber"
      : "green",
  };

  return { core, departments, people, edges };
}

// Pre-generated data for immediate use
export const defaultOrgData = generateOrgMapData(100, 42);

// Large dataset for stress testing
export const largeOrgData = generateOrgMapData(1000, 42);
