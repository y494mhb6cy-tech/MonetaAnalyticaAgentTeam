"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { Agent } from "../lib/maos-types";

// Layout constants
const MODULE_NODE_SIZE = 80;
const AGENT_NODE_SIZE = 12;
const MODULE_SPACING = 280;
const AGENT_SPACING = 60;

// Zoom levels
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;
const ZOOM_SPEED = 0.001;

// Animation timing
const PULSE_DURATION = 2000;

type AgentDependency = {
  fromId: string;
  toId: string;
  weight: number; // 0-1 for line thickness
};

type NodePosition = {
  id: string;
  x: number;
  y: number;
  type: "module" | "agent";
  data: { name: string; module?: string; health?: string; utilization?: number; taskCount?: number };
  agentData?: Agent;
};

interface AgentsTopologyCanvasProps {
  agents: Agent[];
  dependencies: AgentDependency[];
  width: number;
  height: number;
  selectedAgentId?: string | null;
  focusedModule?: string | null;
  onSelectAgent: (agent: Agent | null) => void;
  onHoverAgent: (agent: Agent | null, x: number, y: number) => void;
}

// Deterministic hash for stable positioning
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get health color based on utilization and success rate
function getHealthColor(agent: Agent): string {
  const { utilization, metrics } = agent;
  if (metrics.errorRate > 10 || utilization > 90) return "#ef4444"; // Critical (red)
  if (metrics.errorRate > 5 || utilization > 75) return "#f59e0b"; // Warning (amber)
  return "#22c55e"; // Healthy (green)
}

// Get utilization-based node size
function getNodeSize(utilization: number): number {
  return AGENT_NODE_SIZE + (utilization / 100) * 8;
}

export default function AgentsTopologyCanvas({
  agents,
  dependencies,
  width,
  height,
  selectedAgentId,
  focusedModule,
  onSelectAgent,
  onHoverAgent,
}: AgentsTopologyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Transform state (pan/zoom)
  const [transform, setTransform] = useState({
    x: width / 2,
    y: height / 2,
    scale: 1,
  });

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Touch gesture state
  const lastTouchRef = useRef<{ x: number; y: number; dist: number } | null>(null);

  // Compute module groups
  const moduleGroups = useMemo(() => {
    const groups = new Map<string, Agent[]>();
    agents.forEach((agent) => {
      const list = groups.get(agent.module) || [];
      list.push(agent);
      groups.set(agent.module, list);
    });
    return groups;
  }, [agents]);

  // Compute layout positions (clustered by module)
  const nodePositions = useMemo(() => {
    const positions: NodePosition[] = [];
    const modules = Array.from(moduleGroups.keys());

    // Arrange modules in a grid
    const cols = Math.ceil(Math.sqrt(modules.length));
    const rows = Math.ceil(modules.length / cols);

    modules.forEach((moduleName, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const moduleX = (col - (cols - 1) / 2) * MODULE_SPACING;
      const moduleY = (row - (rows - 1) / 2) * MODULE_SPACING;

      // Add module node (cluster header)
      const moduleAgents = moduleGroups.get(moduleName) || [];
      const avgUtil = moduleAgents.reduce((sum, a) => sum + a.utilization, 0) / moduleAgents.length;
      const taskCount = moduleAgents.length * 2; // Mock task count

      positions.push({
        id: `module-${moduleName}`,
        x: moduleX,
        y: moduleY - MODULE_NODE_SIZE,
        type: "module",
        data: {
          name: moduleName,
          utilization: avgUtil,
          taskCount,
        },
      });

      // Arrange agents in cluster around module
      const agentsInModule = moduleGroups.get(moduleName) || [];
      const angleStep = (2 * Math.PI) / Math.max(agentsInModule.length, 3);

      agentsInModule.forEach((agent, agentIdx) => {
        const angle = agentIdx * angleStep - Math.PI / 2;
        const radius = 100;

        // Add small deterministic jitter for organic feel
        const jitter = ((hashId(agent.id) % 100) / 100 - 0.5) * 12;

        positions.push({
          id: agent.id,
          x: moduleX + Math.cos(angle) * radius + jitter,
          y: moduleY + Math.sin(angle) * radius + jitter,
          type: "agent",
          data: {
            name: agent.name,
            module: agent.module,
            health: getHealthColor(agent),
            utilization: agent.utilization,
          },
          agentData: agent,
        });
      });
    });

    return positions;
  }, [moduleGroups]);

  // Create lookup map for positions
  const positionMap = useMemo(() => {
    const map = new Map<string, NodePosition>();
    nodePositions.forEach((pos) => map.set(pos.id, pos));
    return map;
  }, [nodePositions]);

  // Main render loop
  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Clear canvas
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Apply transform
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      // Draw dependency edges
      drawDependencies(ctx, dependencies, positionMap, timestamp);

      // Draw module clusters (background)
      drawModuleClusters(ctx, nodePositions, focusedModule);

      // Draw agent nodes
      drawAgentNodes(
        ctx,
        nodePositions.filter((n) => n.type === "agent"),
        timestamp,
        hoveredNodeId,
        selectedAgentId ?? null,
        focusedModule
      );

      // Draw module labels
      drawModuleLabels(ctx, nodePositions.filter((n) => n.type === "module"));

      ctx.restore();

      animationRef.current = requestAnimationFrame(render);
    },
    [width, height, transform, nodePositions, positionMap, dependencies, hoveredNodeId, selectedAgentId, focusedModule]
  );

  // Start render loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  // Center view on resize
  useEffect(() => {
    setTransform((t) => ({ ...t, x: width / 2, y: height / 2 }));
  }, [width, height]);

  // Hit test for interactions
  const hitTest = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;

      // Transform to world coordinates
      const worldX = (canvasX - transform.x) / transform.scale;
      const worldY = (canvasY - transform.y) / transform.scale;

      // Check agent nodes first
      for (const node of nodePositions) {
        if (node.type === "agent") {
          const size = getNodeSize(node.data.utilization ?? 50);
          const dx = worldX - node.x;
          const dy = worldY - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < size + 4) {
            return node;
          }
        }
      }

      return null;
    },
    [nodePositions, transform]
  );

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom towards mouse position
      const delta = -e.deltaY * ZOOM_SPEED;
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, transform.scale * (1 + delta)));

      // Adjust translation to zoom towards cursor
      const scaleRatio = newScale / transform.scale;
      const newX = mouseX - (mouseX - transform.x) * scaleRatio;
      const newY = mouseY - (mouseY - transform.y) * scaleRatio;

      setTransform({ x: newX, y: newY, scale: newScale });
    },
    [transform]
  );

  // Mouse drag for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    },
    [transform]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setTransform((t) => ({
          ...t,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }));
      } else {
        // Hit test for hover
        const hit = hitTest(e.clientX, e.clientY);
        if (hit && hit.type === "agent" && hit.agentData) {
          setHoveredNodeId(hit.id);
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            onHoverAgent(hit.agentData, e.clientX - rect.left, e.clientY - rect.top);
          }
        } else {
          if (hoveredNodeId) {
            setHoveredNodeId(null);
            onHoverAgent(null, 0, 0);
          }
        }
      }
    },
    [isDragging, dragStart, hitTest, hoveredNodeId, onHoverAgent]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Click handling
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const hit = hitTest(e.clientX, e.clientY);

      if (!hit || !hit.agentData) {
        onSelectAgent(null);
        return;
      }

      if (hit.type === "agent") {
        onSelectAgent(hit.agentData);

        // Zoom to agent
        const canvas = canvasRef.current;
        if (canvas) {
          const targetScale = 1.8;
          setTransform({
            x: canvas.width / 2 - hit.x * targetScale,
            y: canvas.height / 2 - hit.y * targetScale,
            scale: targetScale,
          });
        }
      }
    },
    [hitTest, onSelectAgent]
  );

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX - transform.x, y: touch.clientY - transform.y });
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY, dist: 0 };
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const centerX = (t1.clientX + t2.clientX) / 2;
        const centerY = (t1.clientY + t2.clientY) / 2;
        lastTouchRef.current = { x: centerX, y: centerY, dist };
      }
    },
    [transform]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isDragging) {
        const touch = e.touches[0];
        setTransform((t) => ({
          ...t,
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        }));
      } else if (e.touches.length === 2 && lastTouchRef.current) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const centerX = (t1.clientX + t2.clientX) / 2;
        const centerY = (t1.clientY + t2.clientY) / 2;

        // Pinch zoom
        const scaleChange = dist / lastTouchRef.current.dist;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, transform.scale * scaleChange));

        // Pan
        const dx = centerX - lastTouchRef.current.x;
        const dy = centerY - lastTouchRef.current.y;

        setTransform({
          x: transform.x + dx,
          y: transform.y + dy,
          scale: newScale,
        });

        lastTouchRef.current = { x: centerX, y: centerY, dist };
      }
    },
    [isDragging, dragStart, transform]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchRef.current = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="touch-none"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

// Drawing functions

function drawModuleClusters(
  ctx: CanvasRenderingContext2D,
  nodePositions: NodePosition[],
  focusedModule?: string | null
) {
  const modules = nodePositions.filter((n) => n.type === "module");

  modules.forEach((moduleNode) => {
    const moduleName = moduleNode.data.name;
    const isFocused = focusedModule === moduleName;

    // Draw cluster background circle
    ctx.beginPath();
    ctx.arc(moduleNode.x, moduleNode.y + 50, 140, 0, Math.PI * 2);
    ctx.fillStyle = isFocused ? "rgba(99, 102, 241, 0.08)" : "rgba(71, 85, 105, 0.04)";
    ctx.fill();
    ctx.strokeStyle = isFocused ? "rgba(99, 102, 241, 0.3)" : "rgba(71, 85, 105, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawModuleLabels(ctx: CanvasRenderingContext2D, moduleNodes: NodePosition[]) {
  ctx.font = "bold 14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  moduleNodes.forEach((node) => {
    const { name, utilization, taskCount } = node.data;

    // Background pill
    const textWidth = ctx.measureText(name).width;
    const padding = 12;
    const pillWidth = textWidth + padding * 2;
    const pillHeight = 28;

    ctx.beginPath();
    ctx.roundRect(
      node.x - pillWidth / 2,
      node.y - pillHeight / 2,
      pillWidth,
      pillHeight,
      pillHeight / 2
    );
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(name, node.x, node.y);

    // Metrics badge
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    const metricText = `${Math.round(utilization ?? 0)}% · ${taskCount} tasks`;
    ctx.fillText(metricText, node.x, node.y + 22);
  });
}

function drawAgentNodes(
  ctx: CanvasRenderingContext2D,
  agentNodes: NodePosition[],
  timestamp: number,
  hoveredId: string | null,
  selectedId: string | null,
  focusedModule: string | null | undefined
) {
  agentNodes.forEach((node) => {
    const { agentData } = node;
    if (!agentData) return;

    const isHovered = node.id === hoveredId;
    const isSelected = node.id === selectedId;
    const isFocusedModule = !focusedModule || agentData.module === focusedModule;

    // Dim nodes not in focused module
    const dimmed = focusedModule && !isFocusedModule;

    // Base radius with hover/select expansion
    let radius = getNodeSize(agentData.utilization);
    if (isSelected) radius = radius * 1.6;
    else if (isHovered) radius = radius * 1.3;

    const healthColor = getHealthColor(agentData);

    // Draw glow for active/critical agents
    if (agentData.status === "Running" && !dimmed) {
      const pulsePhase = (timestamp % PULSE_DURATION) / PULSE_DURATION;
      const pulseRadius = radius + Math.sin(pulsePhase * Math.PI * 2) * 4;
      const pulseOpacity = 0.3 - pulsePhase * 0.2;

      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        radius,
        node.x,
        node.y,
        pulseRadius + 4
      );
      gradient.addColorStop(0, `${healthColor}${Math.round(pulseOpacity * 255).toString(16).padStart(2, "0")}`);
      gradient.addColorStop(1, `${healthColor}00`);
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius + 4, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Main node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = dimmed ? "rgba(71, 85, 105, 0.4)" : healthColor;
    ctx.fill();

    // Task count badge for overloaded agents
    const taskCount = Math.floor(agentData.utilization / 10);
    if (taskCount > 5 && !dimmed) {
      ctx.beginPath();
      ctx.arc(node.x + radius - 3, node.y - radius + 3, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#dc2626";
      ctx.fill();

      ctx.font = "bold 8px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(taskCount), node.x + radius - 3, node.y - radius + 3);
    }

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  });
}

function drawDependencies(
  ctx: CanvasRenderingContext2D,
  dependencies: AgentDependency[],
  positionMap: Map<string, NodePosition>,
  timestamp: number
) {
  dependencies.forEach((dep) => {
    const fromPos = positionMap.get(dep.fromId);
    const toPos = positionMap.get(dep.toId);
    if (!fromPos || !toPos) return;

    // Animated dash offset
    const dashOffset = (timestamp / 40) % 16;

    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);

    ctx.strokeStyle = `rgba(96, 165, 250, ${0.3 + dep.weight * 0.4})`;
    ctx.lineWidth = 1 + dep.weight * 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -dashOffset;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow head
    const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
    const arrowLen = 8;
    const nodeSize = getNodeSize(toPos.data.utilization ?? 50);
    const arrowX = toPos.x - Math.cos(angle) * (nodeSize + 4);
    const arrowY = toPos.y - Math.sin(angle) * (nodeSize + 4);

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - Math.cos(angle - Math.PI / 6) * arrowLen,
      arrowY - Math.sin(angle - Math.PI / 6) * arrowLen
    );
    ctx.lineTo(
      arrowX - Math.cos(angle + Math.PI / 6) * arrowLen,
      arrowY - Math.sin(angle + Math.PI / 6) * arrowLen
    );
    ctx.closePath();
    ctx.fillStyle = `rgba(96, 165, 250, ${0.5 + dep.weight * 0.4})`;
    ctx.fill();
  });
}
