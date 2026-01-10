"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AgentModule,
  AgentNode,
  AgentDependency,
  AgentDepartment,
} from "@/lib/mockData";

interface AgentArchitectureGraphProps {
  departments: AgentDepartment[];
  modules: AgentModule[];
  agents: AgentNode[];
  dependencies: AgentDependency[];
  onModuleClick?: (module: AgentModule) => void;
  onAgentClick?: (agent: AgentNode) => void;
}

interface GraphNode {
  id: string;
  type: "module" | "agent";
  data: AgentModule | AgentNode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export function AgentArchitectureGraph({
  departments,
  modules,
  agents,
  dependencies,
  onModuleClick,
  onAgentClick,
}: AgentArchitectureGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const animationFrameRef = useRef<number>();
  const nodesRef = useRef<GraphNode[]>([]);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Initialize graph layout
  useEffect(() => {
    const nodes: GraphNode[] = [];

    // Create module nodes
    modules.forEach((module, idx) => {
      const dept = departments.find((d) => d.id === module.departmentId);
      const angle = (idx / modules.length) * Math.PI * 2;
      const radius = 200;

      nodes.push({
        id: module.id,
        type: "module",
        data: module,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 40,
        color: dept?.color || "#666",
      });
    });

    // Create agent nodes (positioned near their modules)
    agents.forEach((agent, idx) => {
      const parentModule = nodes.find((n) => n.id === agent.moduleId);
      if (!parentModule) return;

      const dept = departments.find((d) => d.id === agent.departmentId);
      const moduleAgents = agents.filter((a) => a.moduleId === agent.moduleId);
      const agentIdx = moduleAgents.indexOf(agent);
      const totalAgents = moduleAgents.length;

      // Position agents in a circle around their module
      const angle = (agentIdx / totalAgents) * Math.PI * 2;
      const distance = 80;

      nodes.push({
        id: agent.id,
        type: "agent",
        data: agent,
        x: parentModule.x + Math.cos(angle) * distance,
        y: parentModule.y + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        radius: 16,
        color: dept?.color || "#666",
      });
    });

    nodesRef.current = nodes;
  }, [modules, agents, departments]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Render graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.save();

      // Apply transform
      ctx.translate(dimensions.width / 2 + transform.x, dimensions.height / 2 + transform.y);
      ctx.scale(transform.scale, transform.scale);

      // Render dependencies (edges)
      ctx.strokeStyle = "rgba(124, 196, 255, 0.3)";
      ctx.lineWidth = 1.5;

      dependencies.forEach((dep) => {
        const fromNode = nodesRef.current.find((n) => n.id === dep.fromId);
        const toNode = nodesRef.current.find((n) => n.id === dep.toId);

        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = `rgba(124, 196, 255, ${dep.weight * 0.5})`;
          ctx.lineWidth = dep.weight * 3;
          ctx.stroke();

          // Draw arrow
          const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
          const arrowSize = 8;
          const arrowX = toNode.x - Math.cos(angle) * (toNode.radius + 5);
          const arrowY = toNode.y - Math.sin(angle) * (toNode.radius + 5);

          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = `rgba(124, 196, 255, ${dep.weight * 0.5})`;
          ctx.fill();
        }
      });

      // Render nodes
      nodesRef.current.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id;

        // Draw node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        // Node fill
        if (node.type === "module") {
          const gradient = ctx.createRadialGradient(
            node.x,
            node.y,
            0,
            node.x,
            node.y,
            node.radius
          );
          gradient.addColorStop(0, node.color + "cc");
          gradient.addColorStop(1, node.color + "66");
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = node.color + (isHovered ? "dd" : "99");
        }
        ctx.fill();

        // Node border
        ctx.strokeStyle = isHovered ? "#fff" : "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = isHovered ? 3 : 1.5;
        ctx.stroke();

        // Status indicator for modules and agents
        if ("status" in node.data) {
          const status = node.data.status;
          let statusColor = "#10b981"; // healthy/green
          if (status === "warning") statusColor = "#f59e0b";
          if (status === "critical") statusColor = "#ef4444";
          if (status === "offline") statusColor = "#6b7280";

          ctx.beginPath();
          ctx.arc(
            node.x + node.radius * 0.6,
            node.y - node.radius * 0.6,
            node.radius * 0.25,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = statusColor;
          ctx.fill();
          ctx.strokeStyle = "#10151f";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw label
        ctx.fillStyle = "#f1f5f9";
        ctx.font = node.type === "module" ? "bold 12px sans-serif" : "11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const label = node.data.name;
        const maxWidth = node.radius * 2.5;

        if (node.type === "module") {
          ctx.fillText(label, node.x, node.y, maxWidth);
        } else if (isHovered || transform.scale > 1.2) {
          // Only show agent labels when zoomed or hovered
          ctx.fillText(label, node.x, node.y + node.radius + 12, maxWidth);
        }
      });

      ctx.restore();

      // Draw hovered node info
      if (hoveredNode) {
        ctx.fillStyle = "rgba(16, 21, 31, 0.95)";
        ctx.fillRect(10, 10, 280, 100);
        ctx.strokeStyle = "rgba(124, 196, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 280, 100);

        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(hoveredNode.data.name, 20, 30);

        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#98a2b3";

        if (hoveredNode.type === "module") {
          const modData = hoveredNode.data as AgentModule;
          ctx.fillText(`Status: ${modData.status}`, 20, 50);
          ctx.fillText(`Health: ${modData.healthScore}%`, 20, 68);
          ctx.fillText(`Agents: ${modData.agentCount}`, 20, 86);
        } else {
          const agent = hoveredNode.data as AgentNode;
          ctx.fillText(`Status: ${agent.status}`, 20, 50);
          ctx.fillText(`Success: ${agent.successRate}%`, 20, 68);
          ctx.fillText(`Latency: ${agent.avgLatencyMs}ms`, 20, 86);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, dependencies, hoveredNode, transform]);

  // Mouse handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = mouseX - lastMouseRef.current.x;
      const dy = mouseY - lastMouseRef.current.y;
      setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMouseRef.current = { x: mouseX, y: mouseY };
      return;
    }

    // Convert to graph coordinates
    const graphX = (mouseX - dimensions.width / 2 - transform.x) / transform.scale;
    const graphY = (mouseY - dimensions.height / 2 - transform.y) / transform.scale;

    // Check for hover
    const hovered = nodesRef.current.find((node) => {
      const dx = node.x - graphX;
      const dy = node.y - graphY;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    setHoveredNode(hovered || null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    lastMouseRef.current = { x: mouseX, y: mouseY };
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      if (hoveredNode.type === "module" && onModuleClick) {
        onModuleClick(hoveredNode.data as AgentModule);
      } else if (hoveredNode.type === "agent" && onAgentClick) {
        onAgentClick(hoveredNode.data as AgentNode);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.3, Math.min(3, prev.scale * delta)),
    }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
          className="px-3 py-2 bg-[var(--panel)] border border-[var(--border)] rounded text-sm hover:bg-[var(--hover)]"
        >
          +
        </button>
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: Math.max(0.3, prev.scale * 0.8) }))}
          className="px-3 py-2 bg-[var(--panel)] border border-[var(--border)] rounded text-sm hover:bg-[var(--hover)]"
        >
          −
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="px-3 py-2 bg-[var(--panel)] border border-[var(--border)] rounded text-sm hover:bg-[var(--hover)]"
        >
          Reset
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-[var(--panel)] border border-[var(--border)] rounded-lg p-4 text-sm">
        <div className="font-semibold mb-2">Legend</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-[#3b82f6] opacity-80" />
          <span className="text-[var(--muted)]">Module</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-[#3b82f6] opacity-60" />
          <span className="text-[var(--muted)]">Agent</span>
        </div>
        <div className="flex items-center gap-2 mt-3 mb-1">
          <div className="w-3 h-3 rounded-full bg-[#10b981]" />
          <span className="text-[var(--muted)] text-xs">Healthy</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
          <span className="text-[var(--muted)] text-xs">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span className="text-[var(--muted)] text-xs">Critical</span>
        </div>
      </div>
    </div>
  );
}
