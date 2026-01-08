"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Input, PageHeader } from "../../components/ui";

type NodeKind = "personnel" | "agent";

type Personnel = { id: string; name: string; title?: string; team?: string };

type Agent = { id: string; name: string; purpose?: string; module?: string };

type MapNode = { id: string; kind: NodeKind; refId: string; position: { x: number; y: number } };

type MapEdge = { id: string; fromNodeId: string; toNodeId: string; kind: "personnel-agent" };

type MapState = {
  personnel: Personnel[];
  agents: Agent[];
  nodes: MapNode[];
  edges: MapEdge[];
};

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
  didMove: boolean;
};

type Toast = { id: number; message: string };

const storageKey = "maos_map_state_v1";

const canvasSize = { width: 2000, height: 1200 };

const nodeSizes: Record<NodeKind, { width: number; height: number }> = {
  personnel: { width: 200, height: 92 },
  agent: { width: 210, height: 96 }
};

const seedState: MapState = {
  personnel: [
    { id: "personnel-1", name: "Avery Quinn", title: "Ops Lead", team: "Operations" },
    { id: "personnel-2", name: "Riley Chen", title: "Finance Partner", team: "Finance" }
  ],
  agents: [
    { id: "agent-1", name: "Ledger Agent", purpose: "Close reporting", module: "Finance" },
    { id: "agent-2", name: "Pulse Agent", purpose: "Workflow health", module: "Ops" }
  ],
  nodes: [
    { id: "node-1", kind: "personnel", refId: "personnel-1", position: { x: 280, y: 220 } },
    { id: "node-2", kind: "agent", refId: "agent-1", position: { x: 620, y: 240 } }
  ],
  edges: []
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isPersonnel = (value: unknown): value is Personnel => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.id === "string" && typeof value.name === "string";
};

const isAgent = (value: unknown): value is Agent => {
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
  const [mapState, setMapState] = useState<MapState>(seedState);
  const [activeTab, setActiveTab] = useState<NodeKind>("personnel");
  const [search, setSearch] = useState("");
  const [connectMode, setConnectMode] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasInnerRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  const personnelById = useMemo(() => {
    return mapState.personnel.reduce<Record<string, Personnel>>((acc, person) => {
      acc[person.id] = person;
      return acc;
    }, {});
  }, [mapState.personnel]);

  const agentsById = useMemo(() => {
    return mapState.agents.reduce<Record<string, Agent>>((acc, agent) => {
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
    },
    [centerOnNode, mapState.nodes]
  );

  const addItem = (kind: NodeKind) => {
    const baseName = kind === "personnel" ? "New Personnel" : "New Agent";
    const newId = createId();
    const name = `${baseName} ${kind === "personnel" ? mapState.personnel.length + 1 : mapState.agents.length + 1}`;
    if (kind === "personnel") {
      const newPerson: Personnel = { id: newId, name, title: "Role", team: "Team" };
      setMapState((prev) => ({ ...prev, personnel: [...prev.personnel, newPerson] }));
      ensureNodeOnCanvas("personnel", newId);
    } else {
      const newAgent: Agent = { id: newId, name, purpose: "Purpose", module: "Module" };
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
    const columns = 4;
    const horizontalSpacing = 260;
    const verticalSpacing = 180;
    setMapState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const size = nodeSizes[node.kind];
        const x = clamp(140 + col * horizontalSpacing, 0, canvasSize.width - size.width);
        const y = clamp(140 + row * verticalSpacing, 0, canvasSize.height - size.height);
        return { ...node, position: { x, y } };
      })
    }));
  };

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
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
      window.localStorage.setItem(storageKey, JSON.stringify(mapState));
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moneta Analytica OS"
        subtitle="Design your operating system map with personnel and agent connections."
        actions={
          <>
            <Button
              variant="ghost"
              className={connectMode ? "border border-accent-500/60" : "border border-transparent"}
              onClick={() => setConnectMode((prev) => !prev)}
            >
              {connectMode ? "Connect Mode On" : "Connect Mode"}
            </Button>
            <Button variant="ghost" onClick={resetPositions}>
              Clear layout / Reset positions
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase text-slate-400">Sidebar</div>
            <Badge label={activeTab === "personnel" ? `${mapState.personnel.length} Personnel` : `${mapState.agents.length} Agents`} />
          </div>
          <div className="flex gap-2">
            <button
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === "personnel" ? "bg-white/10 text-white" : "bg-white/5 text-slate-300"
              }`}
              onClick={() => setActiveTab("personnel")}
            >
              Personnel
            </button>
            <button
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === "agent" ? "bg-white/10 text-white" : "bg-white/5 text-slate-300"
              }`}
              onClick={() => setActiveTab("agent")}
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
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {activeTab === "personnel" ? "Personnel list" : "Agent list"}
            </div>
            <Button variant="ghost" onClick={() => addItem(activeTab)}>
              + Add
            </Button>
          </div>
          <div className="space-y-2">
            {listItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-xs text-slate-500">
                {activeTab === "personnel" ? "No personnel yet…" : "No agents yet…"}
              </div>
            ) : null}
            {listItems.map((item) => {
              const id = item.id;
              const label = item.name;
              const meta =
                activeTab === "personnel"
                  ? (item as Personnel).title || (item as Personnel).team
                  : (item as Agent).purpose || (item as Agent).module;
              return (
                <button
                  key={id}
                  onClick={() => ensureNodeOnCanvas(activeTab, id)}
                  className="w-full rounded-lg border border-white/10 bg-ink-900/40 px-3 py-2 text-left text-sm hover:border-accent-500/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white">{label}</div>
                    <span className="text-xs text-slate-500">{activeTab === "personnel" ? "👤" : "🤖"}</span>
                  </div>
                  {meta ? <div className="text-xs text-slate-400 mt-1">{meta}</div> : null}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="relative overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div>
              <div className="text-sm text-slate-400">Canvas</div>
              <div className="text-lg font-semibold text-white">Moneta Analytica OS Map</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{connectMode ? "Connect mode: select two nodes" : "Drag nodes to arrange"}</span>
            </div>
          </div>
          <div
            ref={canvasRef}
            className="relative h-[560px] w-full overflow-auto bg-ink-900/60"
          >
            <div
              ref={canvasInnerRef}
              className="relative"
              style={{ width: canvasSize.width, height: canvasSize.height }}
            >
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
                      stroke="rgba(56, 189, 248, 0.6)"
                      strokeWidth={2}
                    />
                  );
                })}
              </svg>
              {mapState.nodes.map((node) => {
                const size = nodeSizes[node.kind];
                const isSelectedForConnect = connectMode && connectFromId === node.id;
                const personnel = node.kind === "personnel" ? personnelById[node.refId] : null;
                const agent = node.kind === "agent" ? agentsById[node.refId] : null;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`absolute rounded-2xl border px-4 py-3 text-left shadow-card transition ${
                      node.kind === "personnel"
                        ? "border-emerald-400/40 bg-emerald-500/10"
                        : "border-sky-400/40 bg-sky-500/10"
                    } ${isSelectedForConnect ? "ring-2 ring-accent-500" : ""}`}
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
                      <div className="text-xs uppercase tracking-wide text-slate-200">
                        {node.kind === "personnel" ? "Personnel" : "Agent"}
                      </div>
                      <span className="text-lg">{node.kind === "personnel" ? "👤" : "🤖"}</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {node.kind === "personnel" ? personnel?.name ?? "Unknown" : agent?.name ?? "Unknown"}
                    </div>
                    <div className="text-xs text-slate-300">
                      {node.kind === "personnel"
                        ? personnel?.title || personnel?.team || ""
                        : agent?.purpose || agent?.module || ""}
                    </div>
                  </button>
                );
              })}
              {emptyCanvas ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                  No nodes yet—add personnel or agents from the sidebar to begin.
                </div>
              ) : null}
            </div>
          </div>
          <div className="border-t border-white/5 px-6 py-3 text-xs text-slate-400">
            Connections persist locally under <span className="text-slate-300">{storageKey}</span>.
          </div>
        </Card>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-lg border border-white/10 bg-ink-800 px-4 py-2 text-sm text-slate-100 shadow-lg">
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
