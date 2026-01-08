"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import orgMap from "../../data/org-map.json";
import { Badge, Button, Card, Input, PageHeader, Select } from "../../components/ui";

// Map rendering approach: custom absolute-positioned nodes + SVG paths for edges (no React Flow).
// Plan: normalize map data into org units + modules + optional people overlays, then measure nodes
// with ResizeObserver to keep edge paths accurate on resize/zoom while animating active links.

type OrgStatus = "Operational" | "Scaling" | "Focused" | "Active" | "Idle" | "Paused";

type NodeKind = "orgUnit" | "module" | "person";

type OrgUnit = {
  id: string;
  kind: "orgUnit";
  name: string;
  ownerTitle?: string;
  parentId?: string | null;
  status?: OrgStatus;
  description?: string;
};

type ModuleDomain = "Finance" | "Ops" | "People" | "Exec" | "Other";

type Module = {
  id: string;
  kind: "module";
  name: string;
  domain: ModuleDomain;
  ownerPersonId?: string;
  orgUnitId?: string;
  status?: OrgStatus;
  description?: string;
  outputs?: Array<{ id: string; title: string; type: "pdf" | "pptx" | "link"; url?: string }>;
  steps?: Array<{ id: string; title: string; qaRequired?: boolean }>;
  activity?: Array<{ id: string; title: string; date: string; status: string }>;
};

type Person = {
  id: string;
  kind: "person";
  name: string;
  title?: string;
  orgUnitId?: string;
  status?: OrgStatus | "out";
};

type Link = {
  id: string;
  sourceId: string;
  targetId: string;
  kind: "reportsTo" | "owns" | "uses";
  activity?: {
    state: "active" | "idle";
    lastSeenAt?: string;
    intensity?: number;
  };
};

type MapNodeData = {
  id: string;
  name: string;
  kind: NodeKind;
  status?: OrgStatus;
  owner?: string;
  description?: string;
  title?: string;
  orgUnitId?: string;
  ownerPersonId?: string;
  domain?: ModuleDomain;
  outputs?: Module["outputs"];
  steps?: Module["steps"];
  activity?: Module["activity"];
};

type PositionedNode = MapNodeData & { x: number; y: number };

type MapEdge = Link;

type Viewport = { x: number; y: number; scale: number };

type MapSelection = { id: string; data: MapNodeData } | null;

type NodeSize = { width: number; height: number };

type OverlaySettings = { showPeople: boolean; showActivity: boolean };

const statusPill: Record<OrgStatus, string> = {
  Operational: "bg-emerald-500/15 text-emerald-300",
  Scaling: "bg-sky-500/15 text-sky-300",
  Focused: "bg-amber-500/15 text-amber-300",
  Active: "bg-emerald-500/15 text-emerald-300",
  Idle: "bg-slate-500/15 text-slate-300",
  Paused: "bg-rose-500/15 text-rose-300"
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const defaultNodeSize: Record<NodeKind, NodeSize> = {
  orgUnit: { width: 220, height: 96 },
  module: { width: 220, height: 110 },
  person: { width: 170, height: 84 }
};

const overlayStorageKey = "moneta-agent-map-overlays";
const moduleDomains: ModuleDomain[] = ["Finance", "Ops", "People", "Exec", "Other"];
const outputTypes = ["pdf", "pptx", "link"] as const;
type OutputType = (typeof outputTypes)[number];
const linkKinds = ["reportsTo", "owns", "uses"] as const;
type LinkKind = (typeof linkKinds)[number];
const activityStates = ["active", "idle"] as const;
type ActivityState = (typeof activityStates)[number];

const edgePath = (source: PositionedNode, target: PositionedNode, nodeSizes: Record<string, NodeSize>) => {
  const sourceSize = nodeSizes[source.id] ?? defaultNodeSize[source.kind];
  const targetSize = nodeSizes[target.id] ?? defaultNodeSize[target.kind];
  const startX = source.x + sourceSize.width / 2;
  const startY = source.y + sourceSize.height;
  const endX = target.x + targetSize.width / 2;
  const endY = target.y;
  const midY = (startY + endY) / 2;
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
};

const edgeStyles = {
  reportsTo: { stroke: "rgba(148, 163, 184, 0.4)", width: 2, dash: "" },
  owns: { stroke: "rgba(148, 163, 184, 0.7)", width: 2.2, dash: "" },
  uses: { stroke: "rgba(56, 189, 248, 0.45)", width: 1.8, dash: "6 6" }
};

export default function MapPage() {
  const [showPeople, setShowPeople] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [search, setSearch] = useState("");
  const [orgUnitFilter, setOrgUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState({ name: "", owner: "", status: "" });
  const [overrides, setOverrides] = useState<Record<string, Partial<MapNodeData>>>({});
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [nodeSizes, setNodeSizes] = useState<Record<string, NodeSize>>({});
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewStart = useRef({ x: 0, y: 0 });

  const withOverride = (id: string, base: MapNodeData) => ({
    ...base,
    ...overrides[id]
  });

  const parsedModules = useMemo<Module[]>(() => {
    return orgMap.modules.map((module) => {
      if (module.domain && !moduleDomains.includes(module.domain as ModuleDomain)) {
        throw new Error(`Unexpected module domain: ${module.domain}`);
      }
      const outputs = (module.outputs ?? []).map((output) => {
        if (!outputTypes.includes(output.type as OutputType)) {
          throw new Error(`Unexpected output type: ${output.type}`);
        }
        return {
          ...output,
          type: output.type as OutputType
        };
      });
      return {
        ...module,
        kind: "module",
        domain: module.domain as ModuleDomain,
        status: module.status as OrgStatus | undefined,
        outputs
      };
    });
  }, []);

  const parsedLinks = useMemo<Link[]>(() => {
    return orgMap.links.map((link) => {
      if (!linkKinds.includes(link.kind as LinkKind)) {
        throw new Error(`Unexpected link kind: ${link.kind}`);
      }
      if (link.activity && !activityStates.includes(link.activity.state as ActivityState)) {
        throw new Error(`Unexpected activity state: ${link.activity.state}`);
      }
      return {
        ...link,
        kind: link.kind as LinkKind,
        activity: link.activity
          ? {
              ...link.activity,
              state: link.activity.state as ActivityState
            }
          : undefined
      };
    });
  }, []);

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = (value: string) =>
      !normalizedSearch || value.toLowerCase().includes(normalizedSearch);

    const orgUnits = orgMap.orgUnits.filter((orgUnit) => {
      const passesFilter = orgUnitFilter === "all" || orgUnit.id === orgUnitFilter;
      const passesStatus = statusFilter === "all" || orgUnit.status === statusFilter;
      const passesSearch = matchesSearch(orgUnit.name);
      return passesFilter && passesStatus && passesSearch;
    });

    const modules = parsedModules.filter((module) => {
      const passesOrg =
        orgUnitFilter === "all" ||
        module.orgUnitId === orgUnitFilter ||
        orgUnits.some((orgUnit) => orgUnit.id === module.orgUnitId);
      const passesStatus = statusFilter === "all" || module.status === statusFilter;
      const passesSearch = matchesSearch(module.name);
      return passesOrg && passesStatus && passesSearch;
    });

    const people = orgMap.people.filter((person) => {
      const belongsToOrg = orgUnits.some((orgUnit) => orgUnit.id === person.orgUnitId);
      return showPeople && belongsToOrg && matchesSearch(person.name);
    });

    return { orgUnits, modules, people };
  }, [orgUnitFilter, parsedModules, search, showPeople, statusFilter]);

  const layout = useMemo(() => {
    const mapNodes: PositionedNode[] = [];
    const mapEdges: MapEdge[] = [];
    const orgUnitSpacing = 380;
    const moduleSpacing = 240;
    const peopleSpacing = 170;
    const rowSpacing = 190;
    const orgUnitCount = filteredData.orgUnits.length || 1;

    mapNodes.push({
      ...withOverride(orgMap.root.id, {
        id: orgMap.root.id,
        name: orgMap.root.name,
        kind: "orgUnit",
        status: orgMap.root.status as OrgStatus,
        owner: orgMap.root.ownerTitle,
        description: orgMap.root.description
      }),
      x: 0,
      y: 0
    });

    filteredData.orgUnits.forEach((orgUnit, orgIndex) => {
      const baseX = (orgIndex - (orgUnitCount - 1) / 2) * orgUnitSpacing;
      const orgY = rowSpacing;
      mapNodes.push({
        ...withOverride(orgUnit.id, {
          id: orgUnit.id,
          name: orgUnit.name,
          kind: "orgUnit",
          status: orgUnit.status as OrgStatus,
          owner: orgUnit.ownerTitle,
          description: orgUnit.description
        }),
        x: baseX,
        y: orgY
      });
      mapEdges.push({ id: `edge-root-${orgUnit.id}`, sourceId: orgMap.root.id, targetId: orgUnit.id, kind: "reportsTo" });

      const orgModules = filteredData.modules.filter((module) => module.orgUnitId === orgUnit.id);
      const moduleCount = orgModules.length || 1;
      orgModules.forEach((module, moduleIndex) => {
        const moduleX = baseX + (moduleIndex - (moduleCount - 1) / 2) * moduleSpacing;
        const moduleY = rowSpacing * 2;
        mapNodes.push({
          ...withOverride(module.id, {
            id: module.id,
            name: module.name,
            kind: "module",
            status: module.status as OrgStatus,
            owner: orgMap.people.find((person) => person.id === module.ownerPersonId)?.name,
            description: module.description,
            orgUnitId: module.orgUnitId,
            ownerPersonId: module.ownerPersonId,
            domain: module.domain,
            outputs: module.outputs,
            steps: module.steps,
            activity: module.activity
          }),
          x: moduleX,
          y: moduleY
        });
        mapEdges.push({ id: `edge-org-${module.id}`, sourceId: orgUnit.id, targetId: module.id, kind: "reportsTo" });

        if (showPeople && module.ownerPersonId) {
          const owner = orgMap.people.find((person) => person.id === module.ownerPersonId);
          if (owner) {
            mapEdges.push({ id: `edge-owner-${module.id}`, sourceId: owner.id, targetId: module.id, kind: "owns" });
          }
        }
      });

      if (showPeople) {
        const orgPeople = filteredData.people.filter((person) => person.orgUnitId === orgUnit.id);
        const peopleCount = orgPeople.length || 1;
        orgPeople.forEach((person, personIndex) => {
          const personX = baseX + (personIndex - (peopleCount - 1) / 2) * peopleSpacing;
          const personY = rowSpacing * 3.05;
          mapNodes.push({
            ...withOverride(person.id, {
              id: person.id,
              name: person.name,
              kind: "person",
              status: person.status as OrgStatus,
              title: person.title,
              orgUnitId: person.orgUnitId
            }),
            x: personX,
            y: personY
          });
        });
      }
    });

    if (showPeople) {
      parsedLinks.forEach((link) => {
        const sourceInLayout = mapNodes.some((node) => node.id === link.sourceId);
        const targetInLayout = mapNodes.some((node) => node.id === link.targetId);
        if (sourceInLayout && targetInLayout && link.kind === "uses") {
          mapEdges.push(link);
        }
      });
    }

    return { nodes: mapNodes, edges: mapEdges };
  }, [filteredData, overrides, parsedLinks, showPeople]);

  const nodeMap = useMemo(() => {
    return layout.nodes.reduce<Record<string, PositionedNode>>((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});
  }, [layout.nodes]);

  const activeNodeIds = useMemo(() => {
    if (!showActivity) {
      return new Set<string>();
    }
    const activeLinks = layout.edges.filter((edge) => edge.activity?.state === "active");
    return new Set(activeLinks.flatMap((edge) => [edge.sourceId, edge.targetId]));
  }, [layout.edges, showActivity]);

  const selectedNode = useMemo<MapSelection>(() => {
    if (!selectedId) {
      return null;
    }
    const data = layout.nodes.find((node) => node.id === selectedId);
    return data ? { id: selectedId, data } : null;
  }, [layout.nodes, selectedId]);

  const statusOptions = ["all", "Operational", "Scaling", "Focused", "Active", "Idle", "Paused"];

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(overlayStorageKey) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as OverlaySettings;
        if (typeof parsed.showPeople === "boolean") {
          setShowPeople(parsed.showPeople);
        }
        if (typeof parsed.showActivity === "boolean") {
          setShowActivity(parsed.showActivity);
        }
      } catch {
        // ignore storage parse errors
      }
    }
  }, []);

  useEffect(() => {
    const payload: OverlaySettings = { showPeople, showActivity };
    window.localStorage.setItem(overlayStorageKey, JSON.stringify(payload));
  }, [showPeople, showActivity]);

  useEffect(() => {
    const handleMouseUp = () => {
      isPanning.current = false;
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let frame: number | null = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      });
    });
    observer.observe(container);
    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let frame: number | null = null;
    const observer = new ResizeObserver((entries) => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        setNodeSizes((prev) => {
          let changed = false;
          const next = { ...prev };
          entries.forEach((entry) => {
            const element = entry.target as HTMLButtonElement;
            const nodeId = element.dataset.nodeId;
            if (!nodeId) {
              return;
            }
            const width = element.offsetWidth;
            const height = element.offsetHeight;
            const current = next[nodeId];
            if (!current || current.width !== width || current.height !== height) {
              next[nodeId] = { width, height };
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      });
    });

    nodeRefs.current.forEach((element) => observer.observe(element));

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      observer.disconnect();
    };
  }, [layout.nodes]);

  useEffect(() => {
    setNodeSizes((prev) => {
      let changed = false;
      const next = { ...prev };
      nodeRefs.current.forEach((element, id) => {
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const current = next[id];
        if (!current || current.width !== width || current.height !== height) {
          next[id] = { width, height };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [layout.nodes, containerSize]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Map"
        subtitle="Explore Moneta Analytica as a living org chart of org units, modules, and ownership overlays."
      />

      <Card className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 lg:grid-cols-3">
          <Input
            label="Search"
            placeholder="Search nodes"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select label="Filter by org unit" value={orgUnitFilter} onChange={(event) => setOrgUnitFilter(event.target.value)}>
            <option value="all">All org units</option>
            {orgMap.orgUnits.map((orgUnit) => (
              <option key={orgUnit.id} value={orgUnit.id}>{orgUnit.name}</option>
            ))}
          </Select>
          <Select label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Overlay toggles control people visibility and activity edge animation. */}
          <Button
            variant="ghost"
            className={showPeople ? "border border-accent-500/50" : "border border-transparent"}
            onClick={() => setShowPeople((prev) => !prev)}
            aria-pressed={showPeople}
          >
            {showPeople ? "Hide People" : "Show People"}
          </Button>
          <Button
            variant="ghost"
            className={showActivity ? "border border-accent-500/50" : "border border-transparent"}
            onClick={() => setShowActivity((prev) => !prev)}
            aria-pressed={showActivity}
          >
            {showActivity ? "Activity On" : "Activity Off"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
          >
            Reset view
          </Button>
          <Badge label={`${filteredData.modules.length} Modules`} />
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
              <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                {layout.edges.map((edge) => {
                  const source = nodeMap[edge.sourceId];
                  const target = nodeMap[edge.targetId];
                  if (!source || !target) {
                    return null;
                  }
                  const style = edgeStyles[edge.kind];
                  const isActive = showActivity && edge.activity?.state === "active";
                  return (
                    <path
                      key={edge.id}
                      d={edgePath(source, target, nodeSizes)}
                      stroke={style.stroke}
                      strokeWidth={style.width}
                      strokeDasharray={style.dash}
                      fill="none"
                      className={isActive ? "edge-path edge-path-active" : "edge-path"}
                    />
                  );
                })}
              </svg>

              {layout.nodes.map((node) => {
                const isActive = activeNodeIds.has(node.id);
                const isPerson = node.kind === "person";
                const nodeWidth = defaultNodeSize[node.kind].width;
                return (
                  <button
                    key={node.id}
                    data-node-id={node.id}
                    ref={(element) => {
                      if (element) {
                        nodeRefs.current.set(node.id, element);
                      } else {
                        nodeRefs.current.delete(node.id);
                      }
                    }}
                    onClick={() => {
                      setSelectedId(node.id);
                      setDraftEdits({
                        name: node.name,
                        owner: node.owner ?? node.title ?? "",
                        status: node.status ?? ""
                      });
                    }}
                    className={`absolute rounded-2xl border text-left shadow-card transition hover:border-accent-500/60 ${
                      isPerson
                        ? "border-white/5 bg-ink-800/60 px-3 py-2"
                        : "border-white/10 bg-ink-800/90 px-4 py-3"
                    }`}
                    style={{
                      left: node.x,
                      top: node.y,
                      width: nodeWidth
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs uppercase tracking-wide text-slate-400">{node.kind}</div>
                      <div className="flex items-center gap-2">
                        {isActive ? <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" /> : null}
                        {node.status ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusPill[node.status]}`}>
                            {node.status}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className={`mt-2 ${isPerson ? "text-xs" : "text-sm"} font-semibold text-white`}>{node.name}</div>
                    {node.owner ? <div className="mt-1 text-xs text-slate-400">{node.owner}</div> : null}
                    {node.title ? <div className="mt-1 text-xs text-slate-500">{node.title}</div> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:hidden space-y-4">
          {filteredData.orgUnits.map((orgUnit) => (
            <Card key={orgUnit.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-slate-400">Org Unit</div>
                  <div className="text-lg font-semibold">{orgUnit.name}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${statusPill[orgUnit.status as OrgStatus]}`}>
                  {orgUnit.status}
                </span>
              </div>
              <div className="space-y-2">
                {filteredData.modules.filter((module) => module.orgUnitId === orgUnit.id).map((module) => (
                  <button
                    key={module.id}
                    onClick={() => {
                      const merged = withOverride(module.id, {
                        id: module.id,
                        name: module.name,
                        kind: "module",
                        status: module.status as OrgStatus,
                        owner: orgMap.people.find((person) => person.id === module.ownerPersonId)?.name,
                        description: module.description,
                        orgUnitId: module.orgUnitId,
                        ownerPersonId: module.ownerPersonId,
                        domain: module.domain,
                        outputs: module.outputs,
                        steps: module.steps,
                        activity: module.activity
                      });
                      setSelectedId(module.id);
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
                        <div className="text-sm font-medium">{module.name}</div>
                        <div className="text-xs text-slate-400">{orgMap.people.find((person) => person.id === module.ownerPersonId)?.name}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusPill[module.status as OrgStatus]}`}>
                        {module.status}
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
                <div className="text-xs uppercase text-slate-400">{selectedNode.data.kind}</div>
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
                {selectedNode.data.domain ? <div className="text-sm text-slate-200">Domain: {selectedNode.data.domain}</div> : null}
                {selectedNode.data.description ? <p className="text-sm text-slate-400">{selectedNode.data.description}</p> : null}
                {selectedNode.data.kind === "orgUnit" ? (
                  <div className="text-sm text-slate-400">
                    Modules: {filteredData.modules.filter((module) => module.orgUnitId === selectedNode.data.id).length}
                    {showPeople ? ` · People: ${filteredData.people.filter((person) => person.orgUnitId === selectedNode.data.id).length}` : null}
                  </div>
                ) : null}
                {selectedNode.data.kind === "person" ? (
                  <div className="text-sm text-slate-400">
                    Org Unit: {orgMap.orgUnits.find((orgUnit) => orgUnit.id === selectedNode.data.orgUnitId)?.name ?? "Unassigned"}
                  </div>
                ) : null}
              </Card>

              <Card className="space-y-2">
                <div className="text-sm text-slate-300">Recent Runs</div>
                {selectedNode.data.activity && selectedNode.data.activity.length ? (
                  <ul className="space-y-2 text-sm">
                    {selectedNode.data.activity.map((run) => (
                      <li key={run.id} className="flex items-center justify-between">
                        <span>{run.title}</span>
                        <span className="text-xs text-slate-400">{run.date}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">No recent activity.</div>
                )}
              </Card>

              <Card className="space-y-2">
                <div className="text-sm text-slate-300">Artifacts</div>
                {selectedNode.data.outputs && selectedNode.data.outputs.length ? (
                  <ul className="space-y-2 text-sm">
                    {selectedNode.data.outputs.map((artifact) => (
                      <li key={artifact.id} className="flex items-center justify-between">
                        <span>{artifact.title}</span>
                        <span className="text-xs text-slate-400">{artifact.type}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">No artifacts yet.</div>
                )}
              </Card>

              {selectedNode.data.kind === "person" ? (
                <Card className="space-y-2">
                  <div className="text-sm text-slate-300">Module Ownership</div>
                  <div className="space-y-2 text-sm text-slate-400">
                    {parsedModules.filter((module) => module.ownerPersonId === selectedNode.data.id).length ? (
                      parsedModules
                        .filter((module) => module.ownerPersonId === selectedNode.data.id)
                        .map((module) => (
                          <div key={module.id}>{module.name}</div>
                        ))
                    ) : (
                      <div>No assigned modules.</div>
                    )}
                  </div>
                </Card>
              ) : null}

              <Card className="space-y-3">
                <div className="text-sm text-slate-300">Settings</div>
                <Input
                  label="Name"
                  value={draftEdits.name}
                  onChange={(event) => setDraftEdits((prev) => ({ ...prev, name: event.target.value }))}
                />
                <Input
                  label={selectedNode.data.kind === "person" ? "Role" : "Owner"}
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
                        status: draftEdits.status as OrgStatus,
                        ...(selectedNode.data.kind === "person"
                          ? { title: draftEdits.owner }
                          : { owner: draftEdits.owner })
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
      <style jsx global>{`
        .edge-path {
          transition: stroke 200ms ease, opacity 200ms ease;
        }
        .edge-path-active {
          stroke-dasharray: 8 8;
          animation: edgePulse 2s ease-in-out infinite;
        }
        @keyframes edgePulse {
          0% {
            stroke-dashoffset: 16;
            opacity: 0.6;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -16;
            opacity: 0.6;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .edge-path-active {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
