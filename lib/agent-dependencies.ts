import type { Agent } from "./maos-types";

export type AgentDependency = {
  fromId: string;
  toId: string;
  weight: number; // 0-1 for line thickness
};

/**
 * Generate mock agent dependencies based on inputs/outputs
 * This creates a realistic topology by matching outputs to inputs
 */
export function generateAgentDependencies(agents: Agent[]): AgentDependency[] {
  const dependencies: AgentDependency[] = [];

  // Create explicit dependencies based on module relationships
  const moduleConnections: Record<string, string[]> = {
    "Lead Routing": ["Sales Ops", "Reporting"],
    "Sales Ops": ["Reporting"],
    "Ledger Close": ["AR Follow-up", "Reporting"],
    "AR Follow-up": ["Reporting"],
    "Scheduling": ["QA", "Reporting"],
    "QA": ["Compliance", "Reporting"],
    "Compliance": ["Reporting"],
  };

  agents.forEach((fromAgent) => {
    const targetModules = moduleConnections[fromAgent.module] || [];

    targetModules.forEach((targetModule) => {
      const targetAgent = agents.find((a) => a.module === targetModule);
      if (targetAgent && targetAgent.id !== fromAgent.id) {
        // Calculate weight based on utilization
        const weight = Math.min(1, (fromAgent.utilization + targetAgent.utilization) / 200);

        dependencies.push({
          fromId: fromAgent.id,
          toId: targetAgent.id,
          weight: Math.max(0.3, weight),
        });
      }
    });
  });

  // Add some cross-team dependencies for realism
  const salesAgents = agents.filter((a) => a.ownerTeam === "Sales");
  const financeAgents = agents.filter((a) => a.ownerTeam === "Finance");
  const opsAgents = agents.filter((a) => a.ownerTeam === "Ops");

  // Sales feeds Finance (revenue data)
  if (salesAgents.length > 0 && financeAgents.length > 0) {
    dependencies.push({
      fromId: salesAgents[0].id,
      toId: financeAgents[0].id,
      weight: 0.7,
    });
  }

  // Ops feeds both Sales and Finance (operational data)
  if (opsAgents.length > 0) {
    if (salesAgents.length > 0) {
      dependencies.push({
        fromId: opsAgents[0].id,
        toId: salesAgents[0].id,
        weight: 0.5,
      });
    }
    if (financeAgents.length > 0 && financeAgents.length > 1) {
      dependencies.push({
        fromId: opsAgents[0].id,
        toId: financeAgents[1]?.id || financeAgents[0].id,
        weight: 0.4,
      });
    }
  }

  return dependencies;
}

/**
 * Get connected agents (upstream and downstream) for a given agent
 */
export function getConnectedAgents(
  agentId: string,
  dependencies: AgentDependency[],
  agents: Agent[]
): { upstream: Agent[]; downstream: Agent[] } {
  const upstream: Agent[] = [];
  const downstream: Agent[] = [];

  dependencies.forEach((dep) => {
    if (dep.toId === agentId) {
      const agent = agents.find((a) => a.id === dep.fromId);
      if (agent) upstream.push(agent);
    }
    if (dep.fromId === agentId) {
      const agent = agents.find((a) => a.id === dep.toId);
      if (agent) downstream.push(agent);
    }
  });

  return { upstream, downstream };
}

/**
 * Get health status for an agent based on metrics
 */
export function getAgentHealth(agent: Agent): "Healthy" | "Warning" | "Critical" {
  const { utilization, metrics } = agent;
  if (metrics.errorRate > 10 || utilization > 90) return "Critical";
  if (metrics.errorRate > 5 || utilization > 75) return "Warning";
  return "Healthy";
}

/**
 * Get criticality level based on dependencies and team
 */
export function getAgentCriticality(
  agent: Agent,
  dependencies: AgentDependency[]
): "Low" | "Medium" | "High" | "Critical" {
  // Count downstream dependencies (how many agents depend on this one)
  const downstreamCount = dependencies.filter((d) => d.fromId === agent.id).length;

  if (downstreamCount >= 3) return "Critical";
  if (downstreamCount >= 2) return "High";
  if (agent.ownerTeam === "Finance" || agent.ownerTeam === "Exec") return "High";
  if (downstreamCount >= 1) return "Medium";
  return "Low";
}
