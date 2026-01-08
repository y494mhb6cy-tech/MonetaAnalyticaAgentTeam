"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import orgMap from "../../data/org-map.json";
import { Badge, Button, Card, Input, PageHeader, Select } from "../../components/ui";

type OrgStatus = "Operational" | "Scaling" | "Focused" | "Active" | "Idle" | "Paused";
type OrgNodeType = "root" | "group" | "agent" | "person";

type OrgRun = { id: string; title: string; date: string; status: string };
type OrgArtifact = { id: string; name: string; type: string; date: string };

type MapNodeData = {
  id: string;
  name: string;
  type: OrgNodeType;
  status?: OrgStatus;
  owner?: string;
  description?: string;
  title?: string;
  runs?: OrgRun[];
  artifacts?: OrgArtifact[];
};

type PositionedNode = MapNodeData & { x: number; y: number };

type Edge = { id: string; source: string; target: string };

type Viewport = { x: number; y: number; scale: number };

type MapSelection = { id: string; data: MapNodeData } | null;

const statusPill: Record<OrgStatus, string> = {
  Operational: "bg-emerald-500/15 text-emerald-300",
  Scaling: "bg-sky-500/15 text-sky-300",
  Focused: "bg-amber-500/15 text-amber-300",
  Active: "bg-emerald-500/15 text-emerald-300",
  Idle: "bg-slate-500/15 text-slate-300",
  Paused: "bg-rose-500/15 text-rose-300"
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const edgePath = (source: PositionedNode, target: PositionedNode) => {
  const startX = source.x + 100;
  const startY = source.y + 100;
  const endX = target.x + 100;
  const endY = target.y + 20;
  const midY = (startY + endY) / 2;
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
};

export default function MapPage() {
  const [showPeople, setShowPeople] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState({ name: "", owner: "", status: "" });
  const [overrides, setOverrides] = useState<Record<string, Partial<MapNodeData>>>({});
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewStart = useRef({ x: 0, y: 0 });

  const withOverride = (id: string, base: MapNodeData) => ({
    ...base,
    ...overrides[id]
  });

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = (value: string) =>
      !normalizedSearch || value.toLowerCase().includes(normalizedSearch);

    const groups = orgMap.groups.filter((group) => {
      const passesGroup = groupFilter === "all" || group.id === groupFilter;
      const passesStatus = statusFilter === "all" || group.status === statusFilter;
      const passesSearch = matchesSearch(group.name);
      return passesGroup && passesStatus && passesSearch;
    });

    const agents = orgMap.agents.filter((agent) => {
      const passesGroup = groupFilter === "all" || agent.groupId === groupFilter;
      const passesStatus = statusFilter === "all" || agent.status === statusFilter;
      const passesSearch = matchesSearch(agent.name);
      return passesGroup && passesStatus && passesSearch;
    });

    const people = orgMap.people.filter((person) => {
      const agent = agents.find((candidate) => candidate.id === person.agentId);
      return showPeople && Boolean(agent) && matchesSearch(person.name);
    });

    return { groups, agents, people };
  }, [groupFilter, search, showPeople, statusFilter]);

  const layout = useMemo(() => {
    const mapNodes: PositionedNode[] = [];
    const mapEdges: Edge[] = [];
    const groupSpacing = 360;
    const agentSpacing = 240;
    const rowSpacing = 180;
    const groupCount = filteredData.groups.length || 1;

    mapNodes.push({
      ...withOverride(orgMap.root.id, {
        id: orgMap.root.id,
        name: orgMap.root.name,
        type: "root",
        status: orgMap.root.status as OrgStatus,
        owner: orgMap.root.owner,
        description: orgMap.root.description
      }),
      x: 0,
      y: 0
    });

    filteredData.groups.forEach((group, groupIndex) => {
      const baseX = (groupIndex - (groupCount - 1) / 2) * groupSpacing;
      const groupY = rowSpacing;
      mapNodes.push({
        ...withOverride(group.id, {
          id: group.id,
          name: group.name,
          type: "group",
          status: group.status as OrgStatus,
          owner: group.owner,
          description: group.description
        }),
        x: baseX,
        y: groupY
      });
      mapEdges.push({ id: `edge-root-${group.id}`, source: orgMap.root.id, target: group.id });

      const groupAgents = filteredData.agents.filter((agent) => agent.groupId === group.id);
      const agentCount = groupAgents.length || 1;
      groupAgents.forEach((agent, agentIndex) => {
        const agentX = baseX + (agentIndex - (agentCount - 1) / 2) * agentSpacing;
        const agentY = rowSpacing * 2;
        mapNodes.push({
          ...withOverride(agent.id, {
            id: agent.id,
            name: agent.name,
            type: "agent",
            status: agent.status as OrgStatus,
            owner: agent.owner,
            description: agent.description,
            runs: agent.runs as OrgRun[],
            artifacts: agent.artifacts as OrgArtifact[]
          }),
          x: agentX,
          y: agentY
        });
        mapEdges.push({ id: `edge-group-${agent.id}`, source: group.id, target: agent.id });

        const person = filteredData.people.find((item) => item.agentId === agent.id);
        if (person) {
          mapNodes.push({
            ...withOverride(person.id, {
              id: person.id,
              name: person.name,
              type: "person",
              title: person.title
            }),
            x: agentX,
            y: rowSpacing * 3
          });
          mapEdges.push({ id: `edge-agent-${person.id}`, source: agent.id, target: person.id });
        }
      });
    });

    return { nodes: mapNodes, edges: mapEdges };
  }, [filteredData, overrides]);

  const nodeMap = useMemo(() => {
    return layout.nodes.reduce<Record<string, PositionedNode>>((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});
  }, [layout.nodes]);

  const selectedNode = useMemo<MapSelection>(() => {
    if (!selectedId) {
      return null;
    }
    const data = layout.nodes.find((node) => node.id === selectedId);
    return data ? { id: selectedId, data } : null;
  }, [layout.nodes, selectedId]);

  const statusOptions = ["all", "Operational", "Scaling", "Focused", "Active", "Idle", "Paused"];

  useEffect(() => {
    const handleMouseUp = () => {
      isPanning.current = false;
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Map"
        subtitle="Explore Moneta Analytica as a living org chart of groups, agents, and owners."
      />

      <Card className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 lg:grid-cols-3">
          <Input
            label="Search"
            placeholder="Search nodes"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select label="Filter by group" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
            <option value="all">All groups</option>
            {orgMap.groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </Select>
          <Select label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setShowPeople((prev) => !prev)}>
            {showPeople ? "Hide People" : "Show People"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
          >
            Reset view
          </Button>
          <Badge label={`${filteredData.agents.length} Agents`} />
        </div>
      </Card>

      <div className="relative">
        <div className="hidden lg:block">
          <div
            ref={containerRef}
            className="relative h-[calc(100vh-320px)] min-h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-ink-900/40"
            onMouseDown={(event) => {
              if (event.button !== 0) {
                return;
              }
              isPanning.current = true;
              panStart.current = { x: event.clientX, y: event.clientY };
              viewStart.current = { x: viewport.x, y: viewport.y };
            }}
            onMouseMove={(event) => {
              if (!isPanning.current) {
                return;
              }
              const deltaX = event.clientX - panStart.current.x;
              const deltaY = event.clientY - panStart.current.y;
              setViewport((prev) => ({
                ...prev,
                x: viewStart.current.x + deltaX,
                y: viewStart.current.y + deltaY
              }));
            }}
            onWheel={(event) => {
              event.preventDefault();
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) {
                return;
              }
              const delta = -event.deltaY * 0.0015;
              const nextScale = clamp(viewport.scale + delta, 0.5, 1.6);
              const offsetX = event.clientX - rect.left;
              const offsetY = event.clientY - rect.top;
              const scaleRatio = nextScale / viewport.scale;
              setViewport((prev) => ({
                scale: nextScale,
                x: offsetX - scaleRatio * (offsetX - prev.x),
                y: offsetY - scaleRatio * (offsetY - prev.y)
              }));
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                transformOrigin: "0 0"
              }}
            >
              <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                {layout.edges.map((edge) => {
                  const source = nodeMap[edge.source];
                  const target = nodeMap[edge.target];
                  if (!source || !target) {
                    return null;
                  }
                  return (
                    <path
                      key={edge.id}
                      d={edgePath(source, target)}
                      stroke="rgba(148, 163, 184, 0.4)"
                      strokeWidth="2"
                      fill="none"
                    />
                  );
                })}
              </svg>

              {layout.nodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => {
                    setSelectedId(node.id);
                    setDraftEdits({
                      name: node.name,
                      owner: node.owner ?? "",
                      status: node.status ?? ""
                    });
                  }}
                  className="absolute rounded-2xl border border-white/10 bg-ink-800/90 px-4 py-3 text-left shadow-card transition hover:border-accent-500/60"
                  style={{
                    left: node.x,
                    top: node.y,
                    width: 200
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs uppercase tracking-wide text-slate-400">{node.type}</div>
                    {node.status ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusPill[node.status]}`}>
                        {node.status}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{node.name}</div>
                  {node.owner ? <div className="mt-1 text-xs text-slate-400">{node.owner}</div> : null}
                  {node.title ? <div className="mt-1 text-xs text-slate-500">{node.title}</div> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:hidden space-y-4">
          {filteredData.groups.map((group) => (
            <Card key={group.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-slate-400">Group</div>
                  <div className="text-lg font-semibold">{group.name}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${statusPill[group.status as OrgStatus]}`}>
                  {group.status}
                </span>
              </div>
              <div className="space-y-2">
                {filteredData.agents.filter((agent) => agent.groupId === group.id).map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      const merged = withOverride(agent.id, {
                        id: agent.id,
                        name: agent.name,
                        type: "agent",
                        status: agent.status as OrgStatus,
                        owner: agent.owner,
                        description: agent.description,
                        runs: agent.runs as OrgRun[],
                        artifacts: agent.artifacts as OrgArtifact[]
                      });
                      setSelectedId(agent.id);
                      setDraftEdits({
                        name: merged.name,
                        owner: merged.owner ?? "",
                        status: merged.status ?? ""
                      });
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-ink-800/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{agent.name}</div>
                        <div className="text-xs text-slate-400">{agent.owner}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusPill[agent.status as OrgStatus]}`}>
                        {agent.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {selectedNode ? (
          <aside className="lg:absolute lg:right-0 lg:top-0 lg:h-full w-full lg:w-[360px] bg-ink-900/95 border border-white/10 rounded-2xl p-6 lg:mt-0 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-slate-400">{selectedNode.data.type}</div>
                <div className="text-xl font-semibold">{selectedNode.data.name}</div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>
            </div>

            <div className="mt-4 space-y-4">
              <Card className="space-y-2">
                <div className="text-sm text-slate-300">Overview</div>
                {selectedNode.data.status ? (
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs ${statusPill[selectedNode.data.status]}`}>
                    {selectedNode.data.status}
                  </div>
                ) : null}
                {selectedNode.data.owner ? <div className="text-sm text-slate-200">Owner: {selectedNode.data.owner}</div> : null}
                {selectedNode.data.title ? <div className="text-sm text-slate-200">Role: {selectedNode.data.title}</div> : null}
                {selectedNode.data.description ? <p className="text-sm text-slate-400">{selectedNode.data.description}</p> : null}
              </Card>

              <Card className="space-y-2">
                <div className="text-sm text-slate-300">Recent Runs</div>
                {selectedNode.data.runs && selectedNode.data.runs.length ? (
                  <ul className="space-y-2 text-sm">
                    {selectedNode.data.runs.map((run) => (
                      <li key={run.id} className="flex items-center justify-between">
                        <span>{run.title}</span>
                        <span className="text-xs text-slate-400">{run.date}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">No recent runs.</div>
                )}
              </Card>

              <Card className="space-y-2">
                <div className="text-sm text-slate-300">Artifacts</div>
                {selectedNode.data.artifacts && selectedNode.data.artifacts.length ? (
                  <ul className="space-y-2 text-sm">
                    {selectedNode.data.artifacts.map((artifact) => (
                      <li key={artifact.id} className="flex items-center justify-between">
                        <span>{artifact.name}</span>
                        <span className="text-xs text-slate-400">{artifact.type}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">No artifacts yet.</div>
                )}
              </Card>

              <Card className="space-y-3">
                <div className="text-sm text-slate-300">Settings</div>
                <Input
                  label="Name"
                  value={draftEdits.name}
                  onChange={(event) => setDraftEdits((prev) => ({ ...prev, name: event.target.value }))}
                />
                <Input
                  label="Owner"
                  value={draftEdits.owner}
                  onChange={(event) => setDraftEdits((prev) => ({ ...prev, owner: event.target.value }))}
                />
                <Select
                  label="Status"
                  value={draftEdits.status}
                  onChange={(event) => setDraftEdits((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="">Select status</option>
                  {statusOptions.filter((status) => status !== "all").map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (!selectedId) {
                      return;
                    }
                    setOverrides((prev) => ({
                      ...prev,
                      [selectedId]: {
                        name: draftEdits.name,
                        owner: draftEdits.owner,
                        status: draftEdits.status as OrgStatus
                      }
                    }));
                  }}
                >
                  Save changes
                </Button>
              </Card>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
