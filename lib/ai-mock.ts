export type AiContextSnapshot = {
  entityName?: string;
  entityKind?: "personnel" | "agent";
  titleOrPurpose?: string;
  teamOrModule?: string;
  status?: string;
  tasks?: Array<{ title: string; status: string; priority: string }>;
  connections?: Array<{ name: string; kind: "personnel" | "agent" }>;
};

export const buildContextSummary = (context?: AiContextSnapshot): string => {
  if (!context || !context.entityName) {
    return "";
  }
  const lines: string[] = [];
  lines.push(`Entity: ${context.entityName} (${context.entityKind ?? "unknown"})`);
  if (context.titleOrPurpose) {
    lines.push(`Role: ${context.titleOrPurpose}`);
  }
  if (context.teamOrModule) {
    lines.push(`Team/Module: ${context.teamOrModule}`);
  }
  if (context.status) {
    lines.push(`Status: ${context.status}`);
  }
  if (context.tasks && context.tasks.length > 0) {
    lines.push("Tasks:");
    context.tasks.slice(0, 6).forEach((task) => {
      lines.push(`- [${task.status}] ${task.title} (${task.priority})`);
    });
  }
  if (context.connections && context.connections.length > 0) {
    const connectionsText = context.connections
      .slice(0, 6)
      .map((item) => `${item.name} (${item.kind})`)
      .join(", ");
    lines.push(`Connections: ${connectionsText}`);
  }
  return lines.join("\n");
};

export const buildMockResponse = (prompt: string, contextSummary: string): string => {
  const cleanPrompt = prompt.trim() || "Provide an operational preview.";
  const hasContext = contextSummary.trim().length > 0;
  const contextBlock = hasContext ? `\n\nContext snapshot:\n${contextSummary}` : "";
  return [
    `Preview (Mock)`,
    `Prompt focus: ${cleanPrompt}`,
    "",
    "Overview:",
    hasContext
      ? "- Summarizing current operating signals using the selected context."
      : "- Summarizing current operating signals with no attached context.",
    "- Highlighting immediate priorities, blockers, and next actions.",
    "",
    "Today’s priorities:",
    "- Confirm execution cadence for top initiatives.",
    "- Resolve at-risk tasks and unblock owners.",
    "- Ship one fast win to maintain momentum.",
    "",
    "Risks + bottlenecks:",
    "- Capacity constraints on key owners.",
    "- Dependency handoffs waiting for confirmation.",
    "- Incomplete visibility on cross-team impact.",
    "",
    "Recommended next 5 actions:",
    "1) Verify top 3 priorities with stakeholders.",
    "2) Assign a clear owner to each blocker.",
    "3) Collapse duplicate workstreams.",
    "4) Schedule a 10-minute alignment check-in.",
    "5) Capture updates for the next leadership brief.",
    contextBlock
  ].join("\n");
};
