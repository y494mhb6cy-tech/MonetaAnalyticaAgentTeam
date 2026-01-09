"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, PageHeader, Select, TextArea, Input, Button, Badge } from "../../components/ui";
import { Artifact, Chain, Contract, Mode, TaskRabbit } from "../../lib/types";
import { estimateCostBand, modeLabels } from "../../lib/run-utils";
import { useLocalStorageBoolean } from "../../lib/storage";

const emptyContract: Contract = {
  profit: [],
  process: [],
  objectivity: []
};

export default function RunPage() {
  const [tasks, setTasks] = useState<TaskRabbit[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedChainId, setSelectedChainId] = useState<string>("");
  const [mode, setMode] = useState<Mode>("standard");
  const [textInput, setTextInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [fileNote, setFileNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string>("");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [deepModeEnabled] = useLocalStorageBoolean("moneta-analytica-deep-mode", false);

  useEffect(() => {
    const load = async () => {
      const [taskRes, chainRes] = await Promise.all([fetch("/api/tasks"), fetch("/api/chains")]);
      const taskData = await taskRes.json();
      const chainData = await chainRes.json();
      setTasks(taskData.tasks ?? []);
      setChains(chainData.chains ?? []);
      if (taskData.tasks?.length) {
        setSelectedTaskId(taskData.tasks[0].id);
        setMode(taskData.tasks[0].defaultMode ?? "standard");
      }
    };
    load();
  }, []);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const contract = selectedTask?.contract ?? emptyContract;

  const totalChars = useMemo(() => {
    return textInput.length + linkInput.length + fileNote.length;
  }, [textInput, linkInput, fileNote]);

  const costBand = estimateCostBand(totalChars);

  const onRun = async () => {
    setError(null);
    setLoading(true);
    setMarkdown("");
    setArtifacts([]);

    const inputs = [
      { type: "text", value: textInput.trim(), name: "Notes" },
      { type: "link", value: linkInput.trim(), name: "Link" },
      { type: "file", value: fileNote.trim(), name: "File" }
    ].filter((input) => input.value.length > 0);

    if (!inputs.length) {
      setError("Provide at least one input to run a task.");
      setLoading(false);
      return;
    }

    if (!selectedTaskId && !selectedChainId) {
      setError("Select an Agent or Chain before running.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: selectedTaskId || undefined,
        chainId: selectedChainId || undefined,
        mode,
        inputs,
        deepModeEnabled
      })
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Run failed.");
      setLoading(false);
      return;
    }

    const data = await response.json();
    setMarkdown(data.markdown ?? "");
    setArtifacts(data.artifacts ?? []);
    setLoading(false);
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (["text/plain", "text/markdown"].includes(file.type)) {
      const text = await file.text();
      setFileNote(text.slice(0, 4000));
      setError(null);
      return;
    }
    if (file.type === "application/pdf") {
      setFileNote(`PDF file received: ${file.name}. Paste key excerpts for best results.`);
      setError(null);
      return;
    }
    setError("Unsupported file type. Use .txt, .md, or .pdf.");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Run an Agent"
        subtitle="Launch a single Agent or a Chain with the MAOS (Moneta Analytica Agent Team) contract injected by default."
      />

      <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
        <Card className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Select label="Agent" value={selectedTaskId} onChange={(event) => {
              setSelectedTaskId(event.target.value);
              setSelectedChainId("");
              const task = tasks.find((item) => item.id === event.target.value);
              if (task) setMode(task.defaultMode);
            }}>
              <option value="">None</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>{task.name}</option>
              ))}
            </Select>
            <Select label="Chain" value={selectedChainId} onChange={(event) => {
              setSelectedChainId(event.target.value);
              if (event.target.value) setSelectedTaskId("");
            }}>
              <option value="">None</option>
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>{chain.name}</option>
              ))}
            </Select>
          </div>

          <TextArea label="Paste inputs" placeholder="Paste notes, data highlights, or context." value={textInput} onChange={(event) => setTextInput(event.target.value)} />
          <Input label="Optional link" placeholder="https://" value={linkInput} onChange={(event) => setLinkInput(event.target.value)} />
          <Input label="File upload (.txt/.md/.pdf)" type="file" accept=".txt,.md,.pdf" onChange={onFileChange} />

          <div className="grid md:grid-cols-3 gap-4">
            {(Object.keys(modeLabels) as Mode[]).map((key) => {
              const modeData = modeLabels[key];
              const disabled = key === "deep" && !deepModeEnabled;
              return (
                <button
                  key={key}
                  onClick={() => !disabled && setMode(key)}
                  className={`p-4 rounded-xl border ${mode === key ? "border-accent-500 bg-white/5" : "border-white/10"} ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-white/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{modeData.label}</span>
                    <Badge label={`Cost: ${modeData.costBand}`} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{modeData.note}</p>
                  {disabled ? <p className="text-xs text-slate-500 mt-2">Enable Deep Mode in Settings.</p> : null}
                </button>
              );
            })}
          </div>

          <Card className="bg-ink-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">Input estimate</div>
              <Badge label={`Mode cost: ${costBand}`} />
            </div>
            <p className="text-sm text-slate-400 mt-2">Based on {totalChars} characters across inputs.</p>
          </Card>

          {error ? <div className="text-sm text-red-400">{error}</div> : null}

          <Button onClick={onRun} disabled={loading}>{loading ? "Running..." : "Run Task"}</Button>
        </Card>

        <Card className="space-y-4">
          <div>
            <div className="text-sm text-slate-400">Contract</div>
            <div className="text-lg font-semibold mt-1">Profit · Process · Objectivity</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Profit</div>
            <ul className="text-sm text-slate-300 mt-2 space-y-1">
              {contract.profit.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Process</div>
            <ul className="text-sm text-slate-300 mt-2 space-y-1">
              {contract.process.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Objectivity</div>
            <ul className="text-sm text-slate-300 mt-2 space-y-1">
              {contract.objectivity.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Output Preview</div>
            <div className="text-lg font-semibold mt-1">Structured executive view</div>
          </div>
          <div className="flex gap-3">
            {artifacts
              .filter((artifact) => artifact.type === "docx" || artifact.type === "pdf")
              .map((artifact) => (
                <a
                  key={artifact.type}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20"
                  href={artifact.pathOrDataUrl}
                  download
                >
                  Download {artifact.type.toUpperCase()}
                </a>
              ))}
          </div>
        </div>
        <div className="mt-6 space-y-4 text-sm text-slate-200">
          {markdown ? <ReactMarkdown>{markdown}</ReactMarkdown> : <p className="text-slate-500">Run a task to see output.</p>}
        </div>
      </Card>
    </div>
  );
}
