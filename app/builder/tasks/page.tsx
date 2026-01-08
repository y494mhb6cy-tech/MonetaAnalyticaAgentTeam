"use client";

import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Card, PageHeader, Input, TextArea, Select, Button } from "../../../components/ui";
import { TaskRabbit, Contract, Mode } from "../../../lib/types";

const emptyContract: Contract = { profit: [], process: [], objectivity: [] };

const modes: Mode[] = ["fast", "standard", "deep"];
const domains = ["Finance", "Ops", "HR", "General"] as const;

export default function TaskBuilderPage() {
  const [tasks, setTasks] = useState<TaskRabbit[]>([]);
  const [contractDefaults, setContractDefaults] = useState<Contract>(emptyContract);
  const [selectedId, setSelectedId] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setContractDefaults(data.contractDefaults ?? emptyContract);
      if (data.tasks?.length) setSelectedId(data.tasks[0].id);
    };
    load();
  }, []);

  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedId), [tasks, selectedId]);

  const [draft, setDraft] = useState<TaskRabbit | null>(null);

  useEffect(() => {
    if (selectedTask) {
      setDraft({ ...selectedTask });
    }
  }, [selectedTask]);

  const onCreate = () => {
    const now = new Date().toISOString();
    const newTask: TaskRabbit = {
      id: `task_${nanoid(8)}`,
      name: "New Agent",
      description: "Describe the outcome.",
      domain: "General",
      defaultMode: "standard",
      outputFormat: ["docx", "pdf"],
      contract: contractDefaults,
      promptTemplate: "",
      createdAt: now,
      updatedAt: now
    };
    setTasks((prev) => [newTask, ...prev]);
    setSelectedId(newTask.id);
    setDraft(newTask);
  };

  const onSave = async () => {
    if (!draft) return;
    const updated = { ...draft, updatedAt: new Date().toISOString() };
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
    setDraft(updated);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agents Builder"
        subtitle="Create and refine single-task Agents for Moneta Analytica OS output runs."
        actions={<Button onClick={onCreate}>New Agent</Button>}
      />

      <div className="grid lg:grid-cols-[1fr,2fr] gap-6">
        <Card className="space-y-4">
          <div className="text-sm text-slate-400">Agents</div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setSelectedId(task.id)}
                className={`w-full text-left px-3 py-2 rounded-lg ${selectedId === task.id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <div className="text-sm font-medium">{task.name}</div>
                <div className="text-xs text-slate-500">{task.domain}</div>
              </button>
            ))}
          </div>
        </Card>

        {draft ? (
          <Card className="space-y-4">
            <Input label="Name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <TextArea label="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            <div className="grid md:grid-cols-2 gap-4">
              <Select label="Domain" value={draft.domain} onChange={(event) => setDraft({ ...draft, domain: event.target.value as TaskRabbit["domain"] })}>
                {domains.map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </Select>
              <Select label="Default Mode" value={draft.defaultMode} onChange={(event) => setDraft({ ...draft, defaultMode: event.target.value as Mode })}>
                {modes.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </Select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Output Formats" value={draft.outputFormat.join(", ")} readOnly />
              <Input label="Contract (uses defaults)" value="Profit · Process · Objectivity" readOnly />
            </div>
            <button className="text-xs text-slate-400 underline" onClick={() => setShowAdvanced((prev) => !prev)}>
              {showAdvanced ? "Hide" : "Show"} advanced prompt template
            </button>
            {showAdvanced ? (
              <TextArea
                label="Prompt Template"
                value={draft.promptTemplate}
                onChange={(event) => setDraft({ ...draft, promptTemplate: event.target.value })}
              />
            ) : null}
            <div className="flex justify-end">
              <Button onClick={onSave}>Save Agent</Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
