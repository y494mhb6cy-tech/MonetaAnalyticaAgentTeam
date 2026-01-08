"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, PageHeader, Select, Input } from "../../components/ui";
import { Artifact, TaskRabbit, Chain, Run } from "../../lib/types";

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [tasks, setTasks] = useState<TaskRabbit[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [runFilter, setRunFilter] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/artifacts");
      const data = await res.json();
      setArtifacts(data.artifacts ?? []);
      setTasks(data.tasks ?? []);
      setChains(data.chains ?? []);
      setRuns(data.runs ?? []);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return artifacts.filter((artifact) => {
      if (typeFilter && artifact.type !== typeFilter) return false;
      if (dateFilter && !artifact.createdAt.startsWith(dateFilter)) return false;
      if (query && !artifact.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (runFilter) {
        const run = runs.find((item) => item.id === artifact.runId);
        if (!run) return false;
        const matchesTask = run.taskId === runFilter;
        const matchesChain = run.chainId === runFilter;
        if (!matchesTask && !matchesChain) return false;
      }
      return true;
    });
  }, [artifacts, typeFilter, dateFilter, query, runFilter, runs]);

  const findRunLabel = (artifact: Artifact) => {
    const run = runs.find((item) => item.id === artifact.runId);
    if (!run) return "Run";
    const task = tasks.find((item) => item.id === run.taskId);
    const chain = chains.find((item) => item.id === run.chainId);
    return task?.name ?? chain?.name ?? "Run";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Artifacts"
        subtitle="Review and download Moneta Analytica OS outputs across tasks and chains."
      />

      <Card>
        <div className="grid md:grid-cols-4 gap-4">
          <Select label="Filter by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">All</option>
            <option value="docx">DOCX</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
            <option value="md">Markdown</option>
          </Select>
          <Select label="Task or Chain" value={runFilter} onChange={(event) => setRunFilter(event.target.value)}>
            <option value="">All</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>{task.name}</option>
            ))}
            {chains.map((chain) => (
              <option key={chain.id} value={chain.id}>{chain.name}</option>
            ))}
          </Select>
          <Input label="Search name" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Executive Brief" />
          <Input label="Date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        </div>
      </Card>

      <Card>
        <div className="text-sm text-slate-400 mb-4">Artifacts</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Task/Chain</th>
                <th className="text-left py-2">Created</th>
                <th className="text-left py-2">Download</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((artifact) => (
                <tr key={artifact.id} className="border-t border-white/5">
                  <td className="py-3">{artifact.name}</td>
                  <td className="py-3 uppercase text-xs text-slate-400">{artifact.type}</td>
                  <td className="py-3">{findRunLabel(artifact)}</td>
                  <td className="py-3 text-slate-400">{artifact.createdAt.slice(0, 10)}</td>
                  <td className="py-3">
                    <a className="text-accent-500" href={artifact.pathOrDataUrl} download>Download</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? <div className="text-slate-500 py-6">No artifacts yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}
