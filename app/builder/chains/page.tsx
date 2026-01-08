"use client";

import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Card, PageHeader, Input, TextArea, Select, Button } from "../../../components/ui";
import { Chain, TaskRabbit, Mode } from "../../../lib/types";

const modes: Mode[] = ["fast", "standard", "deep"];

export default function ChainBuilderPage() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [tasks, setTasks] = useState<TaskRabbit[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<Chain | null>(null);

  useEffect(() => {
    const load = async () => {
      const [chainRes, taskRes] = await Promise.all([fetch("/api/chains"), fetch("/api/tasks")]);
      const chainData = await chainRes.json();
      const taskData = await taskRes.json();
      setChains(chainData.chains ?? []);
      setTasks(taskData.tasks ?? []);
      if (chainData.chains?.length) setSelectedId(chainData.chains[0].id);
    };
    load();
  }, []);

  const selectedChain = useMemo(() => chains.find((chain) => chain.id === selectedId), [chains, selectedId]);

  useEffect(() => {
    if (selectedChain) {
      setDraft({ ...selectedChain });
    }
  }, [selectedChain]);

  const onCreate = () => {
    const now = new Date().toISOString();
    const newChain: Chain = {
      id: `chain_${nanoid(8)}`,
      name: "New Chain",
      description: "Describe the sequence outcome.",
      steps: tasks[0] ? [{ taskId: tasks[0].id }] : [],
      createdAt: now,
      updatedAt: now
    };
    setChains((prev) => [newChain, ...prev]);
    setSelectedId(newChain.id);
    setDraft(newChain);
  };

  const updateStep = (index: number, field: "taskId" | "modeOverride", value: string) => {
    if (!draft) return;
    const steps = draft.steps.map((step, idx) => {
      if (idx !== index) return step;
      return { ...step, [field]: value || undefined };
    });
    setDraft({ ...draft, steps });
  };

  const addStep = () => {
    if (!draft || tasks.length === 0) return;
    setDraft({ ...draft, steps: [...draft.steps, { taskId: tasks[0].id }] });
  };

  const onSave = async () => {
    if (!draft) return;
    const updated = { ...draft, updatedAt: new Date().toISOString() };
    await fetch("/api/chains", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    setChains((prev) => prev.map((chain) => (chain.id === updated.id ? updated : chain)));
    setDraft(updated);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Chains Builder"
        subtitle="Sequence Agents into multi-step Chains for repeatable executive workflows."
        actions={<Button onClick={onCreate}>New Chain</Button>}
      />

      <div className="grid lg:grid-cols-[1fr,2fr] gap-6">
        <Card className="space-y-4">
          <div className="text-sm text-slate-400">Chains</div>
          <div className="space-y-2">
            {chains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => setSelectedId(chain.id)}
                className={`w-full text-left px-3 py-2 rounded-lg ${selectedId === chain.id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <div className="text-sm font-medium">{chain.name}</div>
                <div className="text-xs text-slate-500">{chain.steps.length} steps</div>
              </button>
            ))}
          </div>
        </Card>

        {draft ? (
          <Card className="space-y-4">
            <Input label="Name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <TextArea label="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />

            <div className="space-y-3">
              {draft.steps.map((step, index) => (
                <div key={`${step.taskId}-${index}`} className="grid md:grid-cols-[2fr,1fr] gap-4">
                  <Select label={`Step ${index + 1} Task`} value={step.taskId} onChange={(event) => updateStep(index, "taskId", event.target.value)}>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>{task.name}</option>
                    ))}
                  </Select>
                  <Select label="Mode Override" value={step.modeOverride ?? ""} onChange={(event) => updateStep(index, "modeOverride", event.target.value)}>
                    <option value="">Default</option>
                    {modes.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={addStep}>Add Step</Button>
              <Button onClick={onSave}>Save Chain</Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
