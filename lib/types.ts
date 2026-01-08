export type Mode = "fast" | "standard" | "deep";

export type Contract = {
  profit: string[];
  process: string[];
  objectivity: string[];
};

export type TaskRabbit = {
  id: string;
  name: string;
  description: string;
  domain: "Finance" | "Ops" | "HR" | "General";
  defaultMode: Mode;
  outputFormat: Array<"docx" | "pdf">;
  contract: Contract;
  promptTemplate: string;
  createdAt: string;
  updatedAt: string;
};

export type ChainStep = {
  taskId: string;
  modeOverride?: Mode;
};

export type Chain = {
  id: string;
  name: string;
  description: string;
  steps: ChainStep[];
  createdAt: string;
  updatedAt: string;
};

export type RunInput = {
  type: "text" | "file" | "link";
  name?: string;
  value: string;
};

export type RunStatus = "queued" | "running" | "completed" | "failed";

export type Run = {
  id: string;
  taskId?: string;
  chainId?: string;
  mode: Mode;
  inputs: RunInput[];
  startedAt: string;
  completedAt?: string;
  status: RunStatus;
  outputArtifactIds: string[];
  stats: {
    inputChars: number;
    estimatedCostBand: "Low" | "Medium" | "High";
  };
};

export type Artifact = {
  id: string;
  runId: string;
  name: string;
  type: "docx" | "pdf" | "json" | "md";
  pathOrDataUrl: string;
  createdAt: string;
};

export type StoreData = {
  tasks: TaskRabbit[];
  chains: Chain[];
  runs: Run[];
  artifacts: Artifact[];
  contractDefaults: Contract;
};

export type StructuredOutput = {
  title: string;
  sections: Array<{
    heading: string;
    bullets: string[];
    narrative: string;
  }>;
  risks: string[];
  next_actions: string[];
  contract_alignment: Contract;
};
