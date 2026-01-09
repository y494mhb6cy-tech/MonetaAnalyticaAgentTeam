"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Badge, Button, Card, Input, PageHeader } from "../../components/ui";
import {
  AgentProfile,
  MapEdge,
  MapNode,
  MapState,
  NodeKind,
  PersonnelProfile,
  demoStorageKeys,
  getMapState,
  saveMapState
} from "../../lib/demo-data";

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
  didMove: boolean;
};

type Toast = { id: number; message: string };

type OverlayState = {
  showConnections: boolean;
  showStatus: boolean;
};

const canvasSize = { width: 2600, height: 1600 };

const nodeSizes: Record<NodeKind, { width: number; height: number }> = {
  personnel: { width: 190, height: 86 },
  agent: { width: 200, height: 90 }
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isPersonnel = (value: unknown): value is PersonnelProfile => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.id === "string" && typeof value.name === "string";
};

const isAgent = (value: unknown): value is AgentProfile => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.id === "string" && typeof value.name === "string";
};

const isMapNode = (value: unknown): value is MapNode => {
  if (!isRecord(value)) {
    return false;
  }
  if (value.kind !== "personnel" && value.kind !== "agent") {
    return false;
  }
  if (typeof value.id !== "string" || typeof value.refId !== "string") {
    return false;
  }
  if (!isRecord(value.position)) {
    return false;
  }
  return typeof value.position.x === "number" && typeof value.position.y === "number";
};

const isMapEdge = (value: unknown): value is MapEdge => {
  if (!isRecord(value)) {
    return false;
  }
  if (value.kind !== "personnel-agent") {
    return false;
  }
  return typeof value.id === "string" && typeof value.fromNodeId === "string" && typeof value.toNodeId === "string";
};

const isMapState = (value: unknown): value is MapState => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    Array.isArray(value.personnel) &&
    value.personnel.every(isPersonnel) &&
    Array.isArray(value.agents) &&
    value.agents.every(isAgent) &&
    Array.isArray(value.nodes) &&
    value.nodes.every(isMapNode) &&
    Array.isArray(value.edges) &&
    value.edges.every(isMapEdge)
  );
};

export default function MapPage() {
  const [mapState, setMapState] = useState<MapState>(() => getMapState());
  const [activeTab, setActiveTab] = useState<NodeKind>("personnel");
  const [search, setSearch] = useState("");
  const [connectMode, setConnectMode] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<OverlayState>({ showConnections: true, showStatus: true });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasInnerRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  const personnelById = useMemo(() => {
    return mapState.personnel.reduce<Record<string, PersonnelProfile>>((acc, person) => {
      acc[person.id] = person;
      return acc;
    }, {});
  }, [mapState.personnel]);

  const agentsById = useMemo(() => {
    return mapState.agents.reduce<Record<string, AgentProfile>>((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {});
  }, [mapState.agents]);

  const nodeById = useMemo(() => {
    return mapState.nodes.reduce<Record<string, MapNode>>((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});
  }, [mapState.nodes]);

  const listItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = (value: string) => !normalizedSearch || value.toLowerCase().includes(normalizedSearch);

    if (activeTab === "personnel") {
      return mapState.personnel.filter((person) => matchesSearch(person.name));
    }
    return mapState.agents.filter((agent) => matchesSearch(agent.name));
  }, [activeTab, mapState.agents, mapState.personnel, search]);

  const selectedNode = selectedNodeId ? nodeById[selectedNodeId] : null;
  const selectedPerson = selectedNode?.kind === "personnel" ? personnelById[selectedNode.refId] : null;
  const selectedAgent = selectedNode?.kind === "agent" ? agentsById[selectedNode.refId] : null;

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  const centerOnNode = useCallback(
    (nodeId: string) => {
      const node = nodeById[nodeId];
      const container = canvasRef.current;
      if (!node || !container) {
        return;
      }
      const size = nodeSizes[node.kind];
      const targetLeft = node.position.x + size.width / 2 - container.clientWidth / 2;
      const targetTop = node.position.y + size.height / 2 - container.clientHeight / 2;
      container.scrollTo({
        left: clamp(targetLeft, 0, canvasSize.width - container.clientWidth),
        top: clamp(targetTop, 0, canvasSize.height - container.clientHeight),
        behavior: "smooth"
      });
    },
    [nodeById]
  );

  const ensureNodeOnCanvas = useCallback(
    (kind: NodeKind, refId: string) => {
      const existing = mapState.nodes.find((node) => node.kind === kind && node.refId === refId);
      if (existing) {
        centerOnNode(existing.id);
        setSelectedNodeId(existing.id);
        return;
      }
      const container = canvasRef.current;
      const size = nodeSizes[kind];
      const defaultX = container ? container.scrollLeft + container.clientWidth / 2 : canvasSize.width / 2;
      const defaultY = container ? container.scrollTop + container.clientHeight / 2 : canvasSize.height / 2;
      const position = {
        x: clamp(defaultX - size.width / 2, 0, canvasSize.width - size.width),
        y: clamp(defaultY - size.height / 2, 0, canvasSize.height - size.height)
      };
      const newNode: MapNode = { id: createId(), kind, refId, position };
      setMapState((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }));
      requestAnimationFrame(() => centerOnNode(newNode.id));
      setSelectedNodeId(newNode.id);
    },
    [centerOnNode, mapState.nodes]
  );

  const addItem = (kind: NodeKind) => {
    const baseName = kind === "personnel" ? "New Personnel" : "New Agent";
    const newId = createId();
    const name = `${baseName} ${kind === "personnel" ? mapState.personnel.length + 1 : mapState.agents.length + 1}`;
    if (kind === "personnel") {
      const newPerson: PersonnelProfile = {
        id: newId,
        name,
        title: "Role",
        level: "IC",
        team: "Ops",
        status: "Active",
        capacity: "Balanced",
        responsibilities: ["New responsibility"],
        tasks: [{ task: "New task", role: "R" }],
        metrics: {}
      };
      setMapState((prev) => ({ ...prev, personnel: [...prev.personnel, newPerson] }));
      ensureNodeOnCanvas("personnel", newId);
    } else {
      const newAgent: AgentProfile = {
        id: newId,
        name,
        module: "Module",
        purpose: "Purpose",
        ownerTeam: "Ops",
        inputs: ["Input"],
        outputs: ["Output"],
        runsToday: 0,
        runsWeek: 0,
        avgLatencyMs: 0,
        successRate: 0.99,
        errorRate: 0,
        lastRunAt: new Date().toISOString(),
        health: "Investigating"
      };
      setMapState((prev) => ({ ...prev, agents: [...prev.agents, newAgent] }));
      ensureNodeOnCanvas("agent", newId);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!connectMode) {
      setSelectedNodeId(nodeId);
      return;
    }
    if (!connectFromId) {
      setConnectFromId(nodeId);
      return;
    }
    if (connectFromId === nodeId) {
      setConnectFromId(null);
      return;
    }
    const fromNode = nodeById[connectFromId];
    const toNode = nodeById[nodeId];
    if (!fromNode || !toNode) {
      setConnectFromId(null);
      return;
    }
    if (fromNode.kind === toNode.kind) {
      showToast("Connect a Personnel node to an Agent node.");
      setConnectFromId(null);
      return;
    }
    const exists = mapState.edges.some(
      (edge) =>
        (edge.fromNodeId === fromNode.id && edge.toNodeId === toNode.id) ||
        (edge.fromNodeId === toNode.id && edge.toNodeId === fromNode.id)
    );
    if (exists) {
      showToast("Those nodes are already connected.");
      setConnectFromId(null);
      return;
    }
    const newEdge: MapEdge = {
      id: createId(),
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      kind: "personnel-agent"
    };
    setMapState((prev) => ({ ...prev, edges: [...prev.edges, newEdge] }));
    setConnectFromId(null);
  };

  const resetPositions = () => {
    const columns = 5;
    const horizontalSpacing = 240;
    const verticalSpacing = 170;
    setMapState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const size = nodeSizes[node.kind];
        const x = clamp(120 + col * horizontalSpacing, 0, canvasSize.width - size.width);
        const y = clamp(120 + row * verticalSpacing, 0, canvasSize.height - size.height);
        return { ...node, position: { x, y } };
      })
    }));
  };

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(demoStorageKeys.map) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as unknown;
        if (isMapState(parsed)) {
          setMapState(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    const handle = window.setTimeout(() => {
      saveMapState(mapState);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [hasHydrated, mapState]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const handle = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(handle);
  }, [toast]);

  useEffect(() => {
    if (!connectMode) {
      setConnectFromId(null);
    }
  }, [connectMode]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState.current) {
        return;
      }
      const bounds = canvasInnerRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }
      const node = nodeById[dragState.current.id];
      if (!node) {
        return;
      }
      const size = nodeSizes[node.kind];
      const nextX = event.clientX - bounds.left - dragState.current.offsetX;
      const nextY = event.clientY - bounds.top - dragState.current.offsetY;
      const clampedX = clamp(nextX, 0, canvasSize.width - size.width);
      const clampedY = clamp(nextY, 0, canvasSize.height - size.height);
      if (Math.abs(nextX - node.position.x) > 1 || Math.abs(nextY - node.position.y) > 1) {
        dragState.current.didMove = true;
      }
      setMapState((prev) => ({
        ...prev,
        nodes: prev.nodes.map((item) =>
          item.id === dragState.current?.id ? { ...item, position: { x: clampedX, y: clampedY } } : item
        )
      }));
    };

    const handlePointerUp = () => {
      if (dragState.current?.didMove) {
        suppressClick.current = true;
      }
      dragState.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [nodeById]);

  const emptyCanvas = mapState.nodes.length === 0;

  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) {
      return [] as string[];
    }
    return mapState.edges
      .filter((edge) => edge.fromNodeId === selectedNode.id || edge.toNodeId === selectedNode.id)
      .map((edge) => (edge.fromNodeId === selectedNode.id ? edge.toNodeId : edge.fromNodeId));
  }, [mapState.edges, selectedNode]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Map"
        subtitle="Monitor personnel-to-agent coverage and workload dependencies across the operating system."
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr_320px]">
        <Card className="space-y-4">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Map tools</div>
          <div className="space-y-2">
            <Button
              variant={connectMode ? "primary" : "outline"}
              className="w-full justify-center"
              onClick={() => setConnectMode((prev) => !prev)}
            >
              {connectMode ? "Connect Mode On" : "Connect Nodes"}
            </Button>
            <Button variant="outline" className="w-full" onClick={resetPositions}>
              Reset layout
            </Button>
          </div>
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Overlays</div>
            <button
              className={clsx(
                "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm",
                overlays.showConnections
                  ? "border-[var(--accent)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              )}
              onClick={() => setOverlays((prev) => ({ ...prev, showConnections: !prev.showConnections }))}
              type="button"
            >
              Connections
              <span className="text-xs">{overlays.showConnections ? "On" : "Off"}</span>
            </button>
            <button
              className={clsx(
                "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm",
                overlays.showStatus
                  ? "border-[var(--accent)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              )}
              onClick={() => setOverlays((prev) => ({ ...prev, showStatus: !prev.showStatus }))}
              type="button"
            >
              Status halos
              <span className="text-xs">{overlays.showStatus ? "On" : "Off"}</span>
            </button>
          </div>
          <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
            Drag nodes to reposition. Use connect mode to link personnel to agents. Changes persist in local storage.
          </div>
        </Card>

        <Card className="relative overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Topology</div>
              <div className="text-lg font-semibold">Operating System Map</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span>{connectMode ? "Connect mode: select two nodes" : "Drag nodes to arrange"}</span>
            </div>
          </div>
          <div ref={canvasRef} className="relative h-[620px] w-full overflow-auto bg-[var(--bg)]">
            <div ref={canvasInnerRef} className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
              {overlays.showConnections ? (
                <svg className="absolute inset-0 h-full w-full">
                  {mapState.edges.map((edge) => {
                    const fromNode = nodeById[edge.fromNodeId];
                    const toNode = nodeById[edge.toNodeId];
                    if (!fromNode || !toNode) {
                      return null;
                    }
                    const fromSize = nodeSizes[fromNode.kind];
                    const toSize = nodeSizes[toNode.kind];
                    const startX = fromNode.position.x + fromSize.width / 2;
                    const startY = fromNode.position.y + fromSize.height / 2;
                    const endX = toNode.position.x + toSize.width / 2;
                    const endY = toNode.position.y + toSize.height / 2;
                    return (
                      <line
                        key={edge.id}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="rgba(148, 163, 184, 0.35)"
                        strokeWidth={1.6}
                      />
                    );
                  })}
                </svg>
              ) : null}
              {mapState.nodes.map((node) => {
                const size = nodeSizes[node.kind];
                const isSelectedForConnect = connectMode && connectFromId === node.id;
                const isSelected = selectedNodeId === node.id;
                const personnel = node.kind === "personnel" ? personnelById[node.refId] : null;
                const agent = node.kind === "agent" ? agentsById[node.refId] : null;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={clsx(
                      "absolute rounded-xl border px-3 py-2 text-left text-xs shadow-card transition",
                      node.kind === "personnel"
                        ? "border-emerald-300/40 bg-emerald-500/10"
                        : "border-sky-300/40 bg-sky-500/10",
                      isSelectedForConnect && "ring-2 ring-[var(--accent)]",
                      isSelected && "outline outline-1 outline-[var(--accent)]"
                    )}
                    style={{ left: node.position.x, top: node.position.y, width: size.width, height: size.height }}
                    onPointerDown={(event) => {
                      if (event.button !== 0) {
                        return;
                      }
                      const bounds = canvasInnerRef.current?.getBoundingClientRect();
                      if (!bounds) {
                        return;
                      }
                      dragState.current = {
                        id: node.id,
                        offsetX: event.clientX - bounds.left - node.position.x,
                        offsetY: event.clientY - bounds.top - node.position.y,
                        didMove: false
                      };
                    }}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                        {node.kind === "personnel" ? "Personnel" : "Agent"}
                      </div>
                      <span className="text-sm">{node.kind === "personnel" ? "👤" : "🤖"}</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[var(--text)]">
                      {node.kind === "personnel" ? personnel?.name ?? "Unknown" : agent?.name ?? "Unknown"}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {node.kind === "personnel"
                        ? personnel?.title || personnel?.team || ""
                        : agent?.purpose || agent?.module || ""}
                    </div>
                    {overlays.showStatus && node.kind === "personnel" && personnel ? (
                      <div className="mt-1 text-[10px] uppercase text-[var(--muted)]">{personnel.capacity}</div>
                    ) : null}
                    {overlays.showStatus && node.kind === "agent" && agent ? (
                      <div className="mt-1 text-[10px] uppercase text-[var(--muted)]">{agent.health}</div>
                    ) : null}
                  </button>
                );
              })}
              {emptyCanvas ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">
                  No nodes yet—add personnel or agents from the directory to begin.
                </div>
              ) : null}
            </div>
          </div>
          <div className="border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--muted)]">
            Connections persist locally under <span className="text-[var(--text)]">{demoStorageKeys.map}</span>.
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Directory</div>
              <div className="text-sm text-[var(--text)]">{mapState.personnel.length} Personnel · {mapState.agents.length} Agents</div>
            </div>
            <Badge label={activeTab === "personnel" ? "Personnel" : "Agents"} />
          </div>
          <div className="flex gap-2">
            <button
              className={clsx(
                "flex-1 rounded-md px-3 py-2 text-sm",
                activeTab === "personnel" ? "bg-[var(--selection)] text-[var(--text)]" : "text-[var(--muted)] hover:bg-[var(--hover)]"
              )}
              onClick={() => setActiveTab("personnel")}
              type="button"
            >
              Personnel
            </button>
            <button
              className={clsx(
                "flex-1 rounded-md px-3 py-2 text-sm",
                activeTab === "agent" ? "bg-[var(--selection)] text-[var(--text)]" : "text-[var(--muted)] hover:bg-[var(--hover)]"
              )}
              onClick={() => setActiveTab("agent")}
              type="button"
            >
              Agents
            </button>
          </div>
          <Input
            label={activeTab === "personnel" ? "Search personnel" : "Search agents"}
            placeholder={activeTab === "personnel" ? "Filter by name" : "Filter by agent"}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>{activeTab === "personnel" ? "Personnel list" : "Agent list"}</span>
            <Button variant="ghost" onClick={() => addItem(activeTab)}>
              + Add
            </Button>
          </div>
          <div className="space-y-2">
            {listItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-4 text-xs text-[var(--muted)]">
                {activeTab === "personnel" ? "No personnel yet…" : "No agents yet…"}
              </div>
            ) : null}
            {listItems.map((item) => {
              const id = item.id;
              const label = item.name;
              const meta =
                activeTab === "personnel"
                  ? (item as PersonnelProfile).title || (item as PersonnelProfile).team
                  : (item as AgentProfile).purpose || (item as AgentProfile).module;
              const node = mapState.nodes.find((entry) => entry.kind === activeTab && entry.refId === id);
              return (
                <button
                  key={id}
                  onClick={() => {
                    ensureNodeOnCanvas(activeTab, id);
                    if (node) {
                      setSelectedNodeId(node.id);
                    }
                  }}
                  className={clsx(
                    "w-full rounded-md border px-3 py-2 text-left text-sm",
                    node && node.id === selectedNodeId
                      ? "border-[var(--accent)] bg-[var(--selection)]"
                      : "border-[var(--border)] bg-[var(--panel2)] hover:bg-[var(--hover)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[var(--text)]">{label}</div>
                    <span className="text-xs text-[var(--muted)]">{activeTab === "personnel" ? "👤" : "🤖"}</span>
                  </div>
                  {meta ? <div className="mt-1 text-xs text-[var(--muted)]">{meta}</div> : null}
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--border)] pt-3">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Detail</div>
            {selectedPerson ? (
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="text-lg font-semibold text-[var(--text)]">{selectedPerson.name}</div>
                  <div className="text-xs text-[var(--muted)]">{selectedPerson.title} · {selectedPerson.team}</div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge label={selectedPerson.status} />
                  <Badge label={selectedPerson.capacity} className="bg-emerald-500/10 text-emerald-200" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Responsibilities</div>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                    {selectedPerson.responsibilities.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">RACI Tasks</div>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                    {selectedPerson.tasks.map((task) => (
                      <li key={task.task}>
                        <span className="font-semibold text-[var(--text)]">{task.role}</span> {task.task}
                        {task.partner ? <span className="text-[var(--muted)]"> · {task.partner}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedPerson.metrics.callsWeek !== undefined ? (
                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                    <div>Calls today: <span className="text-[var(--text)]">{selectedPerson.metrics.callsToday}</span></div>
                    <div>Calls week: <span className="text-[var(--text)]">{selectedPerson.metrics.callsWeek}</span></div>
                    <div>Sales today: <span className="text-[var(--text)]">{selectedPerson.metrics.salesToday}</span></div>
                    <div>Sales week: <span className="text-[var(--text)]">{selectedPerson.metrics.salesWeek}</span></div>
                    <div>Revenue week: <span className="text-[var(--text)]">${selectedPerson.metrics.revenueWeek?.toLocaleString()}</span></div>
                  </div>
                ) : null}
                {selectedPerson.metrics.jobsScheduledToday !== undefined ? (
                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                    <div>Jobs scheduled: <span className="text-[var(--text)]">{selectedPerson.metrics.jobsScheduledToday}</span></div>
                    <div>Jobs completed: <span className="text-[var(--text)]">{selectedPerson.metrics.jobsCompletedToday}</span></div>
                    <div>Backlog: <span className="text-[var(--text)]">{selectedPerson.metrics.backlog}</span></div>
                    <div>Overtime hrs: <span className="text-[var(--text)]">{selectedPerson.metrics.overtimeHoursWeek}</span></div>
                  </div>
                ) : null}
                {selectedPerson.metrics.invoicesProcessedToday !== undefined ? (
                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                    <div>Invoices today: <span className="text-[var(--text)]">{selectedPerson.metrics.invoicesProcessedToday}</span></div>
                    <div>AR calls week: <span className="text-[var(--text)]">{selectedPerson.metrics.arCallsWeek}</span></div>
                    <div>Close tasks open: <span className="text-[var(--text)]">{selectedPerson.metrics.closeTasksOpen}</span></div>
                    <div>Days to close: <span className="text-[var(--text)]">{selectedPerson.metrics.daysToCloseEstimate}</span></div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {selectedAgent ? (
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="text-lg font-semibold text-[var(--text)]">{selectedAgent.name}</div>
                  <div className="text-xs text-[var(--muted)]">{selectedAgent.module} · {selectedAgent.ownerTeam}</div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge label={selectedAgent.health} />
                  <Badge label={`${(selectedAgent.successRate * 100).toFixed(1)}% success`} className="bg-sky-500/10 text-sky-200" />
                </div>
                <div className="text-xs text-[var(--muted)]">{selectedAgent.purpose}</div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Inputs</div>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                    {selectedAgent.inputs.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Outputs</div>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                    {selectedAgent.outputs.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                  <div>Runs today: <span className="text-[var(--text)]">{selectedAgent.runsToday}</span></div>
                  <div>Runs week: <span className="text-[var(--text)]">{selectedAgent.runsWeek}</span></div>
                  <div>Latency: <span className="text-[var(--text)]">{selectedAgent.avgLatencyMs}ms</span></div>
                  <div>Error rate: <span className="text-[var(--text)]">{selectedAgent.errorRate.toFixed(2)}%</span></div>
                  <div>Last run: <span className="text-[var(--text)]">{new Date(selectedAgent.lastRunAt).toLocaleString()}</span></div>
                </div>
              </div>
            ) : null}
            {!selectedPerson && !selectedAgent ? (
              <div className="mt-2 text-xs text-[var(--muted)]">Select a node to view detail.</div>
            ) : null}
            {selectedNode && connectedNodeIds.length > 0 ? (
              <div className="mt-3 text-xs text-[var(--muted)]">
                Connected nodes: <span className="text-[var(--text)]">{connectedNodeIds.length}</span>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--text)] shadow-lg">
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
