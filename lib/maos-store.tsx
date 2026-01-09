"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Agent,
  AgentStatus,
  MapState,
  Personnel,
  PersonnelStatus
} from "./maos-types";
import { buildSeedMapState, createMaosId, seedAgents, seedPersonnel } from "./maos-seed";

const PERSONNEL_KEY = "maos_personnel_v1";
const AGENTS_KEY = "maos_agents_v1";
const MAP_KEY = "maos_map_state_v1";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isPersonnel = (value: unknown): value is Personnel => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.id === "string" && typeof value.name === "string" && typeof value.team === "string";
};

const isAgent = (value: unknown): value is Agent => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.id === "string" && typeof value.name === "string" && typeof value.module === "string";
};

const isMapState = (value: unknown): value is MapState => {
  if (!isRecord(value)) {
    return false;
  }
  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return false;
  }
  return typeof value.overlaysEnabled === "boolean";
};

const statusCycle: PersonnelStatus[] = ["Available", "On Call", "Offline"];
const agentStatusCycle: AgentStatus[] = ["Running", "Idle", "Paused"];

const newPersonnelTemplates: Array<Pick<Personnel, "title" | "positionLevel" | "team" | "primaryResponsibilities" | "primaryTasks">> = [
  {
    title: "Revenue Analyst",
    positionLevel: "IC",
    team: "Sales",
    primaryResponsibilities: ["Pipeline insights", "Deal hygiene", "Territory coverage"],
    primaryTasks: ["Review pipeline", "Audit CRM updates", "Support forecast sync"]
  },
  {
    title: "Ops Coordinator",
    positionLevel: "Lead",
    team: "Ops",
    primaryResponsibilities: ["Workflow enablement", "Process audits", "Exec reporting"],
    primaryTasks: ["Review handoffs", "Update runbooks", "Track ops KPIs"]
  },
  {
    title: "Finance Associate",
    positionLevel: "IC",
    team: "Finance",
    primaryResponsibilities: ["Cost controls", "Budget tracking", "Vendor coordination"],
    primaryTasks: ["Update budget", "Reconcile expenses", "Summarize spend"]
  },
  {
    title: "People Experience Lead",
    positionLevel: "Manager",
    team: "HR",
    primaryResponsibilities: ["Engagement programs", "Talent enablement", "Compliance"],
    primaryTasks: ["Plan engagement", "Review headcount", "Audit HR workflows"]
  }
];

const newAgentTemplates: Array<Pick<Agent, "module" | "purpose" | "ownerTeam" | "inputs" | "outputs">> = [
  {
    module: "Sales",
    purpose: "Surfaces at-risk opportunities for leadership review",
    ownerTeam: "Sales",
    inputs: ["Pipeline notes", "Stage history"],
    outputs: ["Risk roster", "Escalation flags"]
  },
  {
    module: "Finance",
    purpose: "Automates variance checks for weekly spend",
    ownerTeam: "Finance",
    inputs: ["Expense logs", "Budget plans"],
    outputs: ["Variance alerts", "Spend summary"]
  },
  {
    module: "Ops",
    purpose: "Monitors fulfillment timelines and SLA risk",
    ownerTeam: "Ops",
    inputs: ["Ticket queues", "SLA definitions"],
    outputs: ["Risk alerts", "Ops digest"]
  },
  {
    module: "HR",
    purpose: "Tracks onboarding progress and manager check-ins",
    ownerTeam: "HR",
    inputs: ["Onboarding tasks", "Manager checklists"],
    outputs: ["Onboarding report", "Follow-up reminders"]
  }
];

const createNewPersonnel = (index: number): Personnel => {
  const template = newPersonnelTemplates[index % newPersonnelTemplates.length];
  return {
    id: createMaosId(),
    name: `New Hire ${index + 1}`,
    title: template.title,
    positionLevel: template.positionLevel,
    team: template.team,
    primaryResponsibilities: template.primaryResponsibilities,
    primaryTasks: template.primaryTasks,
    status: statusCycle[index % statusCycle.length],
    capacity: 60 + ((index * 7) % 35),
    metrics: {
      callsToday: 6 + (index % 8),
      callsWeek: 32 + (index % 20),
      salesToday: 1 + (index % 3),
      salesWeek: 3 + (index % 6),
      revenueWeek: 42000 + index * 9000
    }
  };
};

const createNewAgent = (index: number): Agent => {
  const template = newAgentTemplates[index % newAgentTemplates.length];
  return {
    id: createMaosId(),
    name: `New Agent ${index + 1}`,
    module: template.module,
    purpose: template.purpose,
    ownerTeam: template.ownerTeam,
    inputs: template.inputs,
    outputs: template.outputs,
    status: agentStatusCycle[index % agentStatusCycle.length],
    utilization: 45 + ((index * 9) % 40),
    metrics: {
      runsToday: 10 + (index % 12),
      runsWeek: 55 + (index % 40),
      avgLatencyMs: 540 + (index % 220),
      successRate: 90 + (index % 8)
    }
  };
};

const createNodePosition = (index: number) => {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return { x: 140 + column * 260, y: 140 + row * 180 };
};

const createNodeForRef = (id: string, kind: "personnel" | "agent", index: number) => ({
  id: `node-${id}`,
  kind,
  refId: id,
  position: createNodePosition(index)
});

type MaosContextValue = {
  personnel: Personnel[];
  agents: Agent[];
  mapState: MapState;
  setMapState: React.Dispatch<React.SetStateAction<MapState>>;
  addPersonnel: () => Personnel;
  addAgent: () => Agent;
};

const MaosContext = createContext<MaosContextValue | null>(null);

export function MaosProvider({ children }: { children: React.ReactNode }) {
  const defaultMapState = useMemo(() => buildSeedMapState(seedPersonnel, seedAgents), []);
  const [personnel, setPersonnel] = useState<Personnel[]>(seedPersonnel);
  const [agents, setAgents] = useState<Agent[]>(seedAgents);
  const [mapState, setMapState] = useState<MapState>(defaultMapState);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const load = <T,>(key: string): T | null => {
      const stored = window.localStorage.getItem(key);
      if (!stored) {
        return null;
      }
      try {
        return JSON.parse(stored) as T;
      } catch {
        return null;
      }
    };

    const storedPersonnel = load<unknown>(PERSONNEL_KEY);
    const storedAgents = load<unknown>(AGENTS_KEY);
    const storedMap = load<unknown>(MAP_KEY);

    if (Array.isArray(storedPersonnel) && storedPersonnel.every(isPersonnel)) {
      setPersonnel(storedPersonnel);
    }
    if (Array.isArray(storedAgents) && storedAgents.every(isAgent)) {
      setAgents(storedAgents);
    }
    if (storedMap && isMapState(storedMap)) {
      setMapState(storedMap);
    }

    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    const handle = window.setTimeout(() => {
      window.localStorage.setItem(PERSONNEL_KEY, JSON.stringify(personnel));
      window.localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
      window.localStorage.setItem(MAP_KEY, JSON.stringify(mapState));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [agents, hasHydrated, mapState, personnel]);

  const addPersonnel = useCallback(() => {
    const next = createNewPersonnel(personnel.length);
    setPersonnel((prev) => [...prev, next]);
    setMapState((prev) => ({
      ...prev,
      nodes: [...prev.nodes, createNodeForRef(next.id, "personnel", prev.nodes.length)]
    }));
    return next;
  }, [personnel.length]);

  const addAgent = useCallback(() => {
    const next = createNewAgent(agents.length);
    setAgents((prev) => [...prev, next]);
    setMapState((prev) => ({
      ...prev,
      nodes: [...prev.nodes, createNodeForRef(next.id, "agent", prev.nodes.length)]
    }));
    return next;
  }, [agents.length]);

  const value = useMemo(
    () => ({
      personnel,
      agents,
      mapState,
      setMapState,
      addPersonnel,
      addAgent
    }),
    [addAgent, addPersonnel, agents, mapState, personnel]
  );

  return <MaosContext.Provider value={value}>{children}</MaosContext.Provider>;
}

export function useMaosStore() {
  const context = useContext(MaosContext);
  if (!context) {
    throw new Error("useMaosStore must be used within MaosProvider");
  }
  return context;
}
