import { Contract, Mode, RunInput, StructuredOutput, TaskRabbit } from "./types";

export const modeLabels: Record<Mode, { label: string; costBand: "Low" | "Medium" | "High"; note: string }> = {
  fast: { label: "Fast", costBand: "Low", note: "Quick scan for immediate decisions." },
  standard: { label: "Standard", costBand: "Medium", note: "Balanced depth for leadership clarity." },
  deep: { label: "Deep", costBand: "High", note: "Rigorous analysis for complex decisions." }
};

export function estimateCostBand(inputChars: number): "Low" | "Medium" | "High" {
  if (inputChars < 1000) return "Low";
  if (inputChars < 4000) return "Medium";
  return "High";
}

export function contractText(contract: Contract) {
  return {
    profit: contract.profit.join("; "),
    process: contract.process.join("; "),
    objectivity: contract.objectivity.join("; ")
  };
}

export function buildPrompt(task: TaskRabbit, inputs: RunInput[], mode: Mode) {
  const contract = contractText(task.contract);
  const inputBlock = inputs
    .map((input, index) => {
      const label = input.name ? `${input.name}` : `Input ${index + 1}`;
      return `- ${label} (${input.type}): ${input.value}`;
    })
    .join("\n");

  return `Moneta Analytica Contract: Profit/Process/Objectivity\n\nProfit: ${contract.profit}\nProcess: ${contract.process}\nObjectivity: ${contract.objectivity}\n\nTask: ${task.name}\nDescription: ${task.description}\nMode: ${mode}\n\nInputs:\n${inputBlock}\n\nRespond with valid JSON matching:\n{\n  "title": "...",\n  "sections": [\n    {"heading":"...", "bullets":["..."], "narrative":"..."}\n  ],\n  "risks": ["..."],\n  "next_actions": ["..."],\n  "contract_alignment": {\n    "profit": ["..."],\n    "process": ["..."],\n    "objectivity": ["..."]\n  }\n}`;
}

export function stringifyMarkdown(output: StructuredOutput) {
  const sections = output.sections
    .map((section) => {
      const bullets = section.bullets.map((bullet) => `- ${bullet}`).join("\n");
      return `## ${section.heading}\n\n${section.narrative}\n\n${bullets}`;
    })
    .join("\n\n");

  return `# ${output.title}\n\n${sections}\n\n## Risks\n\n${output.risks
    .map((risk) => `- ${risk}`)
    .join("\n")}\n\n## Next Actions\n\n${output.next_actions
    .map((action) => `- ${action}`)
    .join("\n")}\n\n## Contract Alignment\n\n**Profit**\n${output.contract_alignment.profit.map((item) => `- ${item}`).join("\n")}\n\n**Process**\n${output.contract_alignment.process.map((item) => `- ${item}`).join("\n")}\n\n**Objectivity**\n${output.contract_alignment.objectivity.map((item) => `- ${item}`).join("\n")}`;
}

export function safeJsonParse(raw: string): StructuredOutput | null {
  try {
    return JSON.parse(raw) as StructuredOutput;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = raw.slice(start, end + 1);
      try {
        return JSON.parse(slice) as StructuredOutput;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function defaultMockOutput(task: TaskRabbit): StructuredOutput {
  return {
    title: `${task.name} — Executive Brief`,
    sections: [
      {
        heading: "Executive Summary",
        bullets: [
          "Primary signal captured from inputs",
          "Top constraint impacting outcomes",
          "Most leveraged next step"
        ],
        narrative: "The inputs indicate focused priorities with clear operational leverage." 
      }
    ],
    risks: ["Data gaps may hide secondary constraints."],
    next_actions: ["Confirm owners and timelines for immediate actions."],
    contract_alignment: task.contract
  };
}
