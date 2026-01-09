"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type {
  OrgMapData,
  OrgDepartment,
  OrgPerson,
  FlowEdge,
  PersonnelPresence,
  FlowHealth,
} from "../lib/maos-types";

// Layout constants
const CORE_RADIUS = 80;
const DEPT_RING_INNER = 140;
const DEPT_RING_OUTER = 200;
const PEOPLE_RING_START = 220;
const PEOPLE_RING_SPACING = 45;
const NODE_RADIUS = 8;

// Zoom levels
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_SPEED = 0.001;

// Animation timing
const PULSE_DURATION = 2000;
const BREATHING_DURATION = 3000;

type NodePosition = {
  id: string;
  x: number;
  y: number;
  type: "department" | "person";
  data: OrgDepartment | OrgPerson;
  departmentIdx?: number;
};

type ZoomLevel = 0 | 1 | 2;

interface OrgMapCanvasProps {
  data: OrgMapData;
  width: number;
  height: number;
  showFlowTrace: boolean;
  focusedDepartmentId?: string | null;
  selectedPersonId?: string | null;
  onSelectPerson: (person: OrgPerson | null) => void;
  onSelectDepartment: (dept: OrgDepartment | null) => void;
  onHoverPerson: (person: OrgPerson | null, x: number, y: number) => void;
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

// Get color for flow health
function getFlowHealthColor(health: FlowHealth): string {
  switch (health) {
    case "green":
      return "#22c55e";
    case "amber":
      return "#f59e0b";
    case "red":
      return "#ef4444";
  }
}

// Get color for presence state
function getPresenceColor(presence: PersonnelPresence): string {
  switch (presence) {
    case "offline":
      return "rgba(100, 116, 139, 0.4)";
    case "online":
      return "#3b82f6";
    case "active":
      return "#22c55e";
    case "blocked":
      return "#ef4444";
  }
}

export default function OrgMapCanvas({
  data,
  width,
  height,
  showFlowTrace,
  focusedDepartmentId,
  selectedPersonId,
  onSelectPerson,
  onSelectDepartment,
  onHoverPerson,
}: OrgMapCanvasProps) {
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

  // Edge fade animation
  const [edgeOpacity, setEdgeOpacity] = useState(0);

  // Slow rotation for outer activity layer (people)
  const rotationRef = useRef<number>(0);
  const ROTATION_SPEED = 0.00005; // Very slow rotation

  // Compute zoom level from scale
  const zoomLevel: ZoomLevel = useMemo(() => {
    if (transform.scale < 0.6) return 0;
    if (transform.scale < 1.5) return 1;
    return 2;
  }, [transform.scale]);

  // Compute radial layout positions (memoized, deterministic)
  const nodePositions = useMemo(() => {
    const positions: NodePosition[] = [];
    const { departments, people } = data;

    // Department positions (evenly distributed around core)
    const deptAngleStep = (2 * Math.PI) / departments.length;

    departments.forEach((dept, idx) => {
      const angle = idx * deptAngleStep - Math.PI / 2; // Start from top
      const radius = (DEPT_RING_INNER + DEPT_RING_OUTER) / 2;
      positions.push({
        id: dept.id,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        type: "department",
        data: dept,
        departmentIdx: idx,
      });
    });

    // People positions (distributed along department arcs)
    const peopleByDept = new Map<string, OrgPerson[]>();
    people.forEach((person) => {
      const list = peopleByDept.get(person.departmentId) || [];
      list.push(person);
      peopleByDept.set(person.departmentId, list);
    });

    departments.forEach((dept, deptIdx) => {
      const deptPeople = peopleByDept.get(dept.id) || [];
      const startAngle = deptIdx * deptAngleStep - Math.PI / 2;
      const angleSpan = deptAngleStep * 0.9; // Leave gap between departments

      deptPeople.forEach((person, personIdx) => {
        // Distribute people in concentric rings if too many
        const maxPerRing = Math.max(8, Math.ceil(deptPeople.length / 4));
        const ring = Math.floor(personIdx / maxPerRing);
        const posInRing = personIdx % maxPerRing;
        const ringTotal = Math.min(maxPerRing, deptPeople.length - ring * maxPerRing);

        const radius = PEOPLE_RING_START + ring * PEOPLE_RING_SPACING;
        const angleOffset = (posInRing / ringTotal) * angleSpan - angleSpan / 2;

        // Add small deterministic jitter for organic feel
        const jitter = ((hashId(person.id) % 100) / 100 - 0.5) * 8;
        const angle = startAngle + angleOffset;

        positions.push({
          id: person.id,
          x: Math.cos(angle) * radius + jitter,
          y: Math.sin(angle) * radius + jitter,
          type: "person",
          data: person,
          departmentIdx: deptIdx,
        });
      });
    });

    return positions;
  }, [data]);

  // Create lookup map for positions
  const positionMap = useMemo(() => {
    const map = new Map<string, NodePosition>();
    nodePositions.forEach((pos) => map.set(pos.id, pos));
    return map;
  }, [nodePositions]);

  // Handle edge opacity animation
  useEffect(() => {
    if (showFlowTrace) {
      const start = Date.now();
      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / 300, 1);
        setEdgeOpacity(progress);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    } else {
      const start = Date.now();
      const startOpacity = edgeOpacity;
      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / 300, 1);
        setEdgeOpacity(startOpacity * (1 - progress));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [showFlowTrace]);

  // Main render loop
  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Update rotation for outer layer (subtle, continuous)
      rotationRef.current += ROTATION_SPEED * dt;

      // Clear canvas
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      // Apply transform
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      // Draw edges (only if overlay enabled and has opacity)
      if (edgeOpacity > 0.01) {
        const relevantEdges = focusedDepartmentId
          ? data.edges.filter((edge) => {
              const fromPos = positionMap.get(edge.fromId);
              const toPos = positionMap.get(edge.toId);
              if (!fromPos || !toPos) return false;
              const fromPerson = fromPos.data as OrgPerson;
              const toPerson = toPos.data as OrgPerson;
              return (
                fromPerson.departmentId === focusedDepartmentId ||
                toPerson.departmentId === focusedDepartmentId
              );
            })
          : selectedPersonId
          ? data.edges.filter(
              (edge) =>
                edge.fromId === selectedPersonId ||
                edge.toId === selectedPersonId
            )
          : data.edges.slice(0, 100); // Limit for performance at zoom level 0

        drawEdges(ctx, relevantEdges, positionMap, edgeOpacity, timestamp);
      }

      // Draw department ring segments
      drawDepartmentRing(ctx, data.departments, zoomLevel, timestamp);

      // Draw core
      drawCore(ctx, data.core, timestamp);

      // Draw nodes based on zoom level (with rotation applied)
      if (zoomLevel >= 1) {
        ctx.save();
        ctx.rotate(rotationRef.current);
        drawPeopleNodes(
          ctx,
          nodePositions.filter((n) => n.type === "person"),
          zoomLevel,
          timestamp,
          hoveredNodeId,
          selectedPersonId ?? null,
          focusedDepartmentId ?? null
        );
        ctx.restore();
      }

      // Draw department labels
      drawDepartmentLabels(
        ctx,
        nodePositions.filter((n) => n.type === "department"),
        zoomLevel
      );

      ctx.restore();

      animationRef.current = requestAnimationFrame(render);
    },
    [
      width,
      height,
      transform,
      data,
      nodePositions,
      positionMap,
      zoomLevel,
      edgeOpacity,
      hoveredNodeId,
      selectedPersonId,
      focusedDepartmentId,
    ]
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

      // Check people nodes first (smaller, need precision)
      for (const node of nodePositions) {
        if (node.type === "person") {
          const dx = worldX - node.x;
          const dy = worldY - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < NODE_RADIUS + 4) {
            return node;
          }
        }
      }

      // Check department nodes
      for (const node of nodePositions) {
        if (node.type === "department") {
          const dx = worldX - node.x;
          const dy = worldY - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 30) {
            return node;
          }
        }
      }

      // Check core
      const coreDist = Math.sqrt(worldX * worldX + worldY * worldY);
      if (coreDist < CORE_RADIUS) {
        return { id: "core", type: "core" as const };
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
        if (hit && hit.type === "person") {
          setHoveredNodeId(hit.id);
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            onHoverPerson(hit.data as OrgPerson, e.clientX - rect.left, e.clientY - rect.top);
          }
        } else {
          if (hoveredNodeId) {
            setHoveredNodeId(null);
            onHoverPerson(null, 0, 0);
          }
        }
      }
    },
    [isDragging, dragStart, hitTest, hoveredNodeId, onHoverPerson]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Click handling
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const hit = hitTest(e.clientX, e.clientY);

      if (!hit) {
        onSelectPerson(null);
        onSelectDepartment(null);
        return;
      }

      if (hit.type === "person") {
        const person = hit.data as OrgPerson;
        onSelectPerson(person);
        onSelectDepartment(null);

        // Zoom to person
        const canvas = canvasRef.current;
        if (canvas) {
          const targetScale = 2;
          setTransform({
            x: canvas.width / 2 - hit.x * targetScale,
            y: canvas.height / 2 - hit.y * targetScale,
            scale: targetScale,
          });
        }
      } else if (hit.type === "department") {
        const dept = hit.data as OrgDepartment;
        onSelectDepartment(dept);
        onSelectPerson(null);

        // Zoom to department
        const canvas = canvasRef.current;
        if (canvas) {
          const targetScale = 1.2;
          setTransform({
            x: canvas.width / 2 - hit.x * targetScale,
            y: canvas.height / 2 - hit.y * targetScale,
            scale: targetScale,
          });
        }
      }
    },
    [hitTest, onSelectPerson, onSelectDepartment]
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

function drawCore(
  ctx: CanvasRenderingContext2D,
  core: OrgMapData["core"],
  timestamp: number
) {
  // Core glow
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, CORE_RADIUS);
  gradient.addColorStop(0, "rgba(99, 102, 241, 0.3)");
  gradient.addColorStop(0.7, "rgba(99, 102, 241, 0.1)");
  gradient.addColorStop(1, "rgba(99, 102, 241, 0)");

  ctx.beginPath();
  ctx.arc(0, 0, CORE_RADIUS * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Core circle
  ctx.beginPath();
  ctx.arc(0, 0, CORE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#1e1b4b";
  ctx.fill();
  ctx.strokeStyle = getFlowHealthColor(core.flowHealth);
  ctx.lineWidth = 3;
  ctx.stroke();

  // Core text
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 24px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${core.efficiencyScore}`, 0, -20);

  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Efficiency", 0, 0);

  ctx.font = "14px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText(`${core.activeLoad} active`, 0, 25);
}

function drawDepartmentRing(
  ctx: CanvasRenderingContext2D,
  departments: OrgDepartment[],
  zoomLevel: ZoomLevel,
  timestamp: number
) {
  const angleStep = (2 * Math.PI) / departments.length;
  const gap = 0.02;

  departments.forEach((dept, idx) => {
    const startAngle = idx * angleStep - Math.PI / 2 + gap;
    const endAngle = (idx + 1) * angleStep - Math.PI / 2 - gap;

    // Department arc
    ctx.beginPath();
    ctx.arc(0, 0, DEPT_RING_OUTER, startAngle, endAngle);
    ctx.arc(0, 0, DEPT_RING_INNER, endAngle, startAngle, true);
    ctx.closePath();

    // Fill with department color at low opacity
    ctx.fillStyle = dept.color + "20"; // 12% opacity
    ctx.fill();

    // Stroke with flow health color
    ctx.strokeStyle = getFlowHealthColor(dept.flowHealth);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Efficiency indicator (inner arc thickness)
    const efficiencyAngle = startAngle + (endAngle - startAngle) * (dept.efficiency / 100);
    ctx.beginPath();
    ctx.arc(0, 0, DEPT_RING_INNER + 4, startAngle, efficiencyAngle);
    ctx.strokeStyle = dept.color;
    ctx.lineWidth = 4;
    ctx.stroke();
  });
}

function drawDepartmentLabels(
  ctx: CanvasRenderingContext2D,
  deptNodes: NodePosition[],
  zoomLevel: ZoomLevel
) {
  // Always use larger, bold font for team labels - they must be visible at all zoom levels
  ctx.font = zoomLevel >= 1 ? "bold 15px Inter, system-ui, sans-serif" : "bold 13px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  deptNodes.forEach((node) => {
    const dept = node.data as OrgDepartment;

    // Background pill - larger and more prominent
    const textWidth = ctx.measureText(dept.name).width;
    const padding = 10;
    const pillWidth = textWidth + padding * 2;
    const pillHeight = 26;

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
    ctx.strokeStyle = dept.color + "80"; // More visible border
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label text - always white and bold
    ctx.fillStyle = "#ffffff";
    ctx.fillText(dept.name, node.x, node.y);

    // Active load badge (always show for better context)
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`${dept.activeLoad} active`, node.x, node.y + 20);
  });
}

function drawPeopleNodes(
  ctx: CanvasRenderingContext2D,
  peopleNodes: NodePosition[],
  zoomLevel: ZoomLevel,
  timestamp: number,
  hoveredId: string | null,
  selectedId: string | null,
  focusedDeptId: string | null
) {
  peopleNodes.forEach((node) => {
    const person = node.data as OrgPerson;
    const isHovered = node.id === hoveredId;
    const isSelected = node.id === selectedId;
    const isFocusedDept = focusedDeptId === person.departmentId;

    // Dim nodes not in focused department
    const dimmed = focusedDeptId && !isFocusedDept;

    // Base radius with hover/select expansion
    let radius = NODE_RADIUS;
    if (isSelected) radius = NODE_RADIUS * 1.5;
    else if (isHovered) radius = NODE_RADIUS * 1.3;

    // Draw glow/pulse based on presence - enhanced for visibility
    const baseColor = getPresenceColor(person.presence);

    if (person.presence === "active") {
      // Enhanced pulse effect with glow
      const pulsePhase = (timestamp % PULSE_DURATION) / PULSE_DURATION;
      const pulseRadius = radius + Math.sin(pulsePhase * Math.PI * 2) * 5;
      const pulseOpacity = 0.4 - pulsePhase * 0.25;

      // Outer glow
      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        radius,
        node.x,
        node.y,
        pulseRadius + 6
      );
      gradient.addColorStop(0, `rgba(34, 197, 94, ${pulseOpacity * 0.8})`);
      gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius + 6, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    } else if (person.presence === "blocked") {
      // Breathing red effect - more prominent
      const breathPhase = (timestamp % BREATHING_DURATION) / BREATHING_DURATION;
      const breathIntensity = 0.25 + Math.sin(breathPhase * Math.PI * 2) * 0.2;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${breathIntensity})`;
      ctx.fill();
    } else if (person.presence === "online") {
      // Soft steady glow - more visible
      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        radius,
        node.x,
        node.y,
        radius + 10
      );
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.5)");
      gradient.addColorStop(0.7, "rgba(59, 130, 246, 0.2)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Main node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = dimmed ? "rgba(51, 65, 85, 0.5)" : baseColor;
    ctx.fill();

    // Gold edge for high-leverage people
    if (person.leverageScore > 80) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (isSelected) {
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw initials at zoom level 2
    if (zoomLevel >= 2 && !dimmed) {
      ctx.font = "bold 8px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(person.avatarInitials, node.x, node.y);
    }
  });
}

function drawEdges(
  ctx: CanvasRenderingContext2D,
  edges: FlowEdge[],
  positionMap: Map<string, NodePosition>,
  opacity: number,
  timestamp: number
) {
  ctx.globalAlpha = opacity;

  edges.forEach((edge) => {
    const fromPos = positionMap.get(edge.fromId);
    const toPos = positionMap.get(edge.toId);
    if (!fromPos || !toPos) return;

    // Animated dash offset
    const dashOffset = (timestamp / 50) % 20;

    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);

    ctx.strokeStyle = `rgba(124, 196, 255, ${0.4 * edge.weight})`;
    ctx.lineWidth = 1 + edge.weight;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -dashOffset;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow head
    const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
    const arrowLen = 8;
    const arrowX = toPos.x - Math.cos(angle) * (NODE_RADIUS + 4);
    const arrowY = toPos.y - Math.sin(angle) * (NODE_RADIUS + 4);

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
    ctx.fillStyle = `rgba(124, 196, 255, ${0.6 * edge.weight})`;
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}
