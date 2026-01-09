"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AgentDetailPanel, PersonnelDetailPanel } from "../../components/MaosDetailPanel";
import { Badge, Button, Card, PageHeader } from "../../components/ui";
import { SectionLayout } from "../../components/SectionLayout";
import { Agent, MapNode, NodeKind, Personnel } from "../../lib/maos-types";
import { useMaosStore } from "../../lib/maos-store";

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
  didMove: boolean;
};

type Toast = { id: number; message: string };

const canvasSize = { width: 2200, height: 1400 };

const nodeSizes: Record<NodeKind, { width: number; height: number }> = {
  personnel: { width: 200, height: 92 },
  agent: { width: 210, height: 96 }
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function MapContent() {
  const { personnel, agents, mapState, setMapState } = useMaosStore();
  const [connectMode, setConnectMode] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasInnerRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const searchParams = useSearchParams();

  const personnelById = useMemo(() => {
    return personnel.reduce<Record<string, Personnel>>((acc, person) => {
      acc[person.id] = person;
      return acc;
    }, {});
  }, [personnel]);

  const agentsById = useMemo(() => {
    return agents.reduce<Record<string, Agent>>((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {});
  }, [agents]);

  const nodeById = useMemo(() => {
    return mapState.nodes.reduce<Record<string, MapNode>>((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});
  }, [mapState.nodes]);

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
        return existing.id;
      }
      const container = canvasRef.current;
      const size = nodeSizes[kind];
      const defaultX = container ? container.scrollLeft + container.clientWidth / 2 : canvasSize.width / 2;
      const defaultY = container ? container.scrollTop + container.clientHeight / 2 : canvasSize.height / 2;
      const position = {
        x: clamp(defaultX - size.width / 2, 0, canvasSize.width - size.width),
        y: clamp(defaultY - size.height / 2, 0, canvasSize.height - size.height)
      };
      const newNode: MapNode = { id: `node-${refId}`, kind, refId, position };
      setMapState((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }));
      requestAnimationFrame(() => centerOnNode(newNode.id));
      return newNode.id;
    },
    [centerOnNode, mapState.nodes, setMapState]
  );

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
    const newEdge = {
      id: `${fromNode.id}-${toNode.id}`,
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      kind: "personnel-agent" as const
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
  }, [nodeById, setMapState]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus) {
      return;
    }
    const [kindValue, refId] = focus.split(":");
    if (!refId || (kindValue !== "personnel" && kindValue !== "agent")) {
      return;
    }
    const nodeId = ensureNodeOnCanvas(kindValue, refId);
    setSelectedNodeId(nodeId);
    setHighlightedNodeId(nodeId);
  }, [ensureNodeOnCanvas, searchParams]);

  useEffect(() => {
    if (!highlightedNodeId) {
      return;
    }
    const handle = window.setTimeout(() => setHighlightedNodeId(null), 1800);
    return () => window.clearTimeout(handle);
  }, [highlightedNodeId]);

  const hoveredNode = hoveredNodeId ? nodeById[hoveredNodeId] : null;
  const hoveredPersonnel = hoveredNode?.kind === "personnel" ? personnelById[hoveredNode.refId] : null;
  const hoveredAgent = hoveredNode?.kind === "agent" ? agentsById[hoveredNode.refId] : null;

  const selectedNode = selectedNodeId ? nodeById[selectedNodeId] : null;
  const selectedPersonnel = selectedNode?.kind === "personnel" ? personnelById[selectedNode.refId] : null;
  const selectedAgent = selectedNode?.kind === "agent" ? agentsById[selectedNode.refId] : null;

  const emptyCanvas = mapState.nodes.length === 0;

  const renderHoveredMetrics = () => {
    if (hoveredPersonnel?.metrics.sales) {
      return `Calls/week ${hoveredPersonnel.metrics.sales.callsWeek} · Sales/week ${hoveredPersonnel.metrics.sales.salesWeek}`;
    }
    if (hoveredPersonnel?.metrics.ops) {
      return `Jobs today ${hoveredPersonnel.metrics.ops.jobsCompletedToday} · Backlog ${hoveredPersonnel.metrics.ops.backlog}`;
    }
    if (hoveredPersonnel?.metrics.finance) {
      return `Invoices today ${hoveredPersonnel.metrics.finance.invoicesProcessedToday} · Close tasks ${hoveredPersonnel.metrics.finance.closeTasksOpen}`;
    }
    return "Capacity insight available";
  };

  const detailPanel = selectedPersonnel ? (
    <PersonnelDetailPanel person={selectedPersonnel} onClose={() => setSelectedNodeId(null)} />
  ) : selectedAgent ? (
    <AgentDetailPanel agent={selectedAgent} onClose={() => setSelectedNodeId(null)} />
  ) : (
    <Card className="flex items-center justify-center text-sm text-[color:var(--muted)]">Select a node to view details.</Card>
  );

  return (
    <SectionLayout
      sidebar={
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Map controls</div>
            <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">Topology tools</div>
          </div>
          <div className="space-y-3">
            <Button
              variant="ghost"
              className={connectMode ? "border-[color:var(--accent)]" : ""}
              onClick={() => setConnectMode((prev) => !prev)}
            >
              {connectMode ? "Connect Mode On" : "Connect Mode"}
            </Button>
            <Button
              variant="ghost"
              className={mapState.overlaysEnabled ? "border-[color:var(--accent)]" : ""}
              onClick={() =>
                setMapState((prev) => ({
                  ...prev,
                  overlaysEnabled: !prev.overlaysEnabled
                }))
              }
            >
              {mapState.overlaysEnabled ? "Live overlays on" : "Live overlays"}
            </Button>
            <Button variant="ghost" onClick={resetPositions}>
              Reset layout
            </Button>
          </div>
          <div className="space-y-3 text-xs text-[color:var(--muted)]">
            <Badge label={`${personnel.length} Personnel`} />
            <Badge label={`${agents.length} Agents`} />
            <div>{connectMode ? "Connect mode: select two nodes" : "Drag nodes to arrange"}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Legend</div>
            <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
              <div>👤 Personnel nodes</div>
              <div>🤖 Agent nodes</div>
            </div>
          </div>
        </div>
      }
      detail={detailPanel}
    >
      <div className="space-y-6">
        <PageHeader
          title="Moneta Analytica OS Map"
          subtitle="System topology connecting personnel and autonomous agents."
        />

        <Card className="relative overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Canvas</div>
              <div className="text-lg font-semibold text-[color:var(--text)]">Topology workspace</div>
            </div>
            <div className="text-xs text-[color:var(--muted)]">Nodes are persisted in maos_map_state_v2.</div>
          </div>
          <div ref={canvasRef} className="relative h-[620px] w-full overflow-auto bg-[color:var(--panel2)]">
            <div ref={canvasInnerRef} className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
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
                      stroke="rgba(124, 196, 255, 0.55)"
                      strokeWidth={2}
                    />
                  );
                })}
              </svg>
              {mapState.nodes.map((node) => {
                const size = nodeSizes[node.kind];
                const isSelectedForConnect = connectMode && connectFromId === node.id;
                const personnelData = node.kind === "personnel" ? personnelById[node.refId] : null;
                const agentData = node.kind === "agent" ? agentsById[node.refId] : null;
                const isHighlighted = highlightedNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`absolute rounded-xl border px-4 py-3 text-left shadow-lg transition ${
                      node.kind === "personnel"
                        ? "border-emerald-400/40 bg-emerald-500/10"
                        : "border-sky-400/40 bg-sky-500/10"
                    } ${isSelectedForConnect ? "ring-2 ring-[color:var(--accent)]" : ""} ${isHighlighted ? "ring-2 ring-[color:var(--accent)] animate-pulse" : ""}`}
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
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    {mapState.overlaysEnabled ? (
                      <span className="absolute -top-3 right-3 rounded-full border border-[color:var(--border)] bg-[var(--panel)] px-2 py-0.5 text-[10px] text-[color:var(--text)]">
                        {node.kind === "personnel" ? "On call" : "Running"}
                      </span>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                        {node.kind === "personnel" ? "Personnel" : "Agent"}
                      </div>
                      <span className="text-lg">{node.kind === "personnel" ? "👤" : "🤖"}</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[color:var(--text)]">
                      {node.kind === "personnel" ? personnelData?.name ?? "Unknown" : agentData?.name ?? "Unknown"}
                    </div>
                    <div className="text-xs text-[color:var(--muted)]">
                      {node.kind === "personnel"
                        ? personnelData?.title || personnelData?.team || ""
                        : agentData?.purpose || agentData?.module || ""}
                    </div>
                  </button>
                );
              })}
              {hoveredNode && (hoveredPersonnel || hoveredAgent) ? (
                <div
                  className="absolute z-20 w-64 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] p-4 text-xs text-[color:var(--text)] shadow-xl pointer-events-none"
                  style={{
                    left: clamp(hoveredNode.position.x + nodeSizes[hoveredNode.kind].width + 16, 16, canvasSize.width - 280),
                    top: clamp(hoveredNode.position.y, 16, canvasSize.height - 200)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-[color:var(--text)]">
                      {hoveredPersonnel?.name ?? hoveredAgent?.name}
                    </div>
                    <span className="rounded-full border border-[color:var(--border)] bg-[var(--panel2)] px-2 py-0.5 text-[10px] uppercase text-[color:var(--muted)]">
                      {hoveredNode.kind}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[color:var(--muted)]">
                    {hoveredPersonnel ? (
                      <>
                        <div>{hoveredPersonnel.team} · {hoveredPersonnel.status}</div>
                        <div>Capacity {hoveredPersonnel.capacity}%</div>
                        <div className="text-[color:var(--muted)]">{renderHoveredMetrics()}</div>
                      </>
                    ) : null}
                    {hoveredAgent ? (
                      <>
                        <div>{hoveredAgent.module} · {hoveredAgent.status}</div>
                        <div>Utilization {hoveredAgent.utilization}%</div>
                        <div className="text-[color:var(--muted)]">Runs/week {hoveredAgent.metrics.runsWeek} · Success {hoveredAgent.metrics.successRate}%</div>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {emptyCanvas ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[color:var(--muted)]">
                  No nodes yet—add personnel or agents to begin.
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        {toast ? (
          <div className="fixed bottom-6 right-6 rounded-lg border border-[color:var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[color:var(--text)] shadow-lg">
            {toast.message}
          </div>
        ) : null}
      </div>
    </SectionLayout>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading map…</div>}>
      <MapContent />
    </Suspense>
  );
}
