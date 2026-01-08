"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader } from "../components/ui";
import { TaskRabbit, Chain, Run } from "../lib/types";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskRabbit[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    const load = async () => {
      const [taskRes, artifactRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/artifacts")
      ]);
      const taskData = await taskRes.json();
      const artifactData = await artifactRes.json();
      setTasks(taskData.tasks ?? []);
      setChains(artifactData.chains ?? []);
      setRuns(artifactData.runs ?? []);
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Moneta Analytica Dashboard"
        subtitle="Executive visibility into Task Rabbits, Chains, and recent output momentum."
      />

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <div className="text-sm text-slate-400">Task Rabbits</div>
          <div className="text-3xl font-semibold mt-2">{tasks.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Chains</div>
          <div className="text-3xl font-semibold mt-2">{chains.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Runs</div>
          <div className="text-3xl font-semibold mt-2">{runs.length}</div>
        </Card>
      </div>

      <Card>
        <div className="text-sm text-slate-300">Contract Preview</div>
        <div className="mt-4 text-lg font-medium">Profit · Process · Objectivity</div>
        <p className="text-slate-400 mt-2 max-w-2xl">
          Every run injects the Moneta Analytica contract for margin expansion, operational clarity, and
          evidence-based decisions.
        </p>
      </Card>
    </div>
  );
}
