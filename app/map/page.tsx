"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { OrgPerson, OrgDepartment, OrgMapData, CompanyTask, MapOverlayMode, MapDensity, MapLabelMode } from "../../lib/maos-types";
import { salesOrgData, companyTasks } from "../../lib/sales-mock-data";
import MapControlBar from "../../components/MapControlBar";
import MapLegend from "../../components/MapLegend";
import MapDetailsDrawer from "../../components/MapDetailsDrawer";
import MapTooltip from "../../components/MapTooltip";
import TaskFeed from "../../components/TaskFeed";
import TaskDetailsDrawer from "../../components/TaskDetailsDrawer";
import RevenueDragOverlay from "../../components/RevenueDragOverlay";
import { BuildVersion } from "../../components/BuildVersion";
import { Layers, Eye, Grid3x3, DollarSign, BarChart3, ChevronUp, ChevronDown, X } from "lucide-react";

// Dynamic import for canvas component to avoid SSR issues
const OrgMapCanvas = dynamic(() => import("../../components/OrgMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading map...</span>
      </div>
    </div>
  ),
});

type TimeWindow = "24h" | "7d";

export default function PersonnelMapPage() {
  // Canvas size management
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Map state
  const [showFlowTrace, setShowFlowTrace] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h");
  const [overlayMode, setOverlayMode] = useState<MapOverlayMode>("tasks");
  const [density, setDensity] = useState<MapDensity>("comfortable");
  const [labelMode, setLabelMode] = useState<MapLabelMode>("keyOnly");
  const [showRevenueOverlay, setShowRevenueOverlay] = useState(false);

  // Selection state
  const [selectedPerson, setSelectedPerson] = useState<OrgPerson | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<OrgDepartment | null>(null);

  // Task state
  const [selectedTask, setSelectedTask] = useState<CompanyTask | null>(null);
  const [filterTeamId, setFilterTeamId] = useState<string | null>(null);
  const [filterPersonId, setFilterPersonId] = useState<string | null>(null);

  // Hover state for tooltip
  const [hoveredPerson, setHoveredPerson] = useState<{
    person: OrgPerson;
    x: number;
    y: number;
  } | null>(null);

  // Mobile panel states
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [mobileTasksOpen, setMobileTasksOpen] = useState(false);

  // Use sales company data (120 people across 5 teams)
  const orgData = useMemo<OrgMapData>(() => salesOrgData, []);
  const tasks = useMemo<CompanyTask[]>(() => companyTasks, []);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Handlers
  const handleSelectPerson = useCallback((person: OrgPerson | null) => {
    setSelectedPerson(person);
    if (person) {
      setSelectedDepartment(null);
      setFilterPersonId(person.id);
      setFilterTeamId(null);
    }
  }, []);

  const handleSelectDepartment = useCallback((dept: OrgDepartment | null) => {
    setSelectedDepartment(dept);
    if (dept) {
      setSelectedPerson(null);
      setFilterTeamId(dept.id);
      setFilterPersonId(null);
    }
  }, []);

  const handleHoverPerson = useCallback(
    (person: OrgPerson | null, x: number, y: number) => {
      if (person) {
        setHoveredPerson({ person, x, y });
      } else {
        setHoveredPerson(null);
      }
    },
    []
  );

  const handleCloseDrawer = useCallback(() => {
    setSelectedPerson(null);
    setSelectedDepartment(null);
  }, []);

  const handleToggleFlowTrace = useCallback(() => {
    setShowFlowTrace((prev) => !prev);
  }, []);

  const handleTimeWindowChange = useCallback((window: TimeWindow) => {
    setTimeWindow(window);
  }, []);

  const handleTaskClick = useCallback((task: CompanyTask) => {
    setSelectedTask(task);
  }, []);

  const handleCloseTaskDrawer = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleRunAgent = useCallback((agentId: string) => {
    // Stub for AI preview - could open AIPreviewDrawer
    console.log("Running agent:", agentId);
    alert(`AI Agent Preview: ${agentId}\n\nThis would open the AI preview panel with agent recommendations.`);
  }, []);

  // Determine focused department from selection
  const focusedDepartmentId = useMemo(() => {
    if (selectedDepartment) return selectedDepartment.id;
    if (selectedPerson) return selectedPerson.departmentId;
    return null;
  }, [selectedDepartment, selectedPerson]);

  return (
    <div className="h-[calc(100vh-52px)] w-full flex flex-col bg-slate-950 overflow-hidden pb-16 md:pb-0">
      {/* Map region (full height on mobile, 65% on desktop) */}
      <div className={`flex-1 min-h-0 relative bg-slate-950 ${mobileTasksOpen ? 'hidden md:block' : ''}`}>
        <div ref={containerRef} className="absolute inset-0">
          <OrgMapCanvas
            data={orgData}
            width={dimensions.width}
            height={dimensions.height}
            showFlowTrace={showFlowTrace}
            focusedDepartmentId={focusedDepartmentId}
            selectedPersonId={selectedPerson?.id || null}
            onSelectPerson={handleSelectPerson}
            onSelectDepartment={handleSelectDepartment}
            onHoverPerson={handleHoverPerson}
            overlayMode={overlayMode}
            labelMode={labelMode}
          />
        </div>

        {/* Control bar (top-left) */}
        <MapControlBar
          showFlowTrace={showFlowTrace}
          timeWindow={timeWindow}
          onToggleFlowTrace={handleToggleFlowTrace}
          onTimeWindowChange={handleTimeWindowChange}
        />

        {/* Enhanced controls (top-left, below control bar) - hidden on mobile by default */}
        <div className={`absolute top-20 left-4 z-20 space-y-2 ${mobileControlsOpen ? 'block' : 'hidden md:block'}`}>
          {/* Revenue/Drag overlay toggle */}
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Revenue Analysis
            </div>
            <button
              onClick={() => setShowRevenueOverlay(!showRevenueOverlay)}
              className={`w-full px-3 py-2 text-xs rounded flex items-center justify-center gap-2 transition-colors ${
                showRevenueOverlay
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              {showRevenueOverlay ? "Hide Overlay" : "Show Overlay"}
            </button>
          </div>

          {/* Overlay mode toggle */}
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1">
              Node Display
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setOverlayMode("none")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  overlayMode === "none"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                None
              </button>
              <button
                onClick={() => setOverlayMode("tasks")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  overlayMode === "tasks"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setOverlayMode("agents")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  overlayMode === "agents"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Agents
              </button>
            </div>
          </div>

          {/* Density toggle */}
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1 flex items-center gap-1">
              <Grid3x3 className="w-3 h-3" />
              Density
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setDensity("compact")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  density === "compact"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => setDensity("comfortable")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  density === "comfortable"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Comfortable
              </button>
            </div>
          </div>

          {/* Label mode toggle */}
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Labels
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setLabelMode("off")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  labelMode === "off"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Off
              </button>
              <button
                onClick={() => setLabelMode("keyOnly")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  labelMode === "keyOnly"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Key
              </button>
              <button
                onClick={() => setLabelMode("all")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  labelMode === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Revenue/Drag overlay panel */}
        {showRevenueOverlay && (
          <RevenueDragOverlay
            tasks={tasks}
            orgData={orgData}
            selectedTeamId={filterTeamId}
            onTeamSelect={(teamId) => {
              setFilterTeamId(teamId);
              if (teamId) {
                const dept = orgData.departments.find(d => d.id === teamId);
                if (dept) {
                  setSelectedDepartment(dept);
                  setSelectedPerson(null);
                }
              } else {
                setSelectedDepartment(null);
              }
            }}
          />
        )}

        {/* Legend (bottom-left) */}
        {!showRevenueOverlay && <MapLegend />}

        {/* Hover tooltip (desktop only) */}
        {hoveredPerson && !selectedPerson && (
          <MapTooltip
            person={hoveredPerson.person}
            x={hoveredPerson.x}
            y={hoveredPerson.y}
          />
        )}

        {/* Details drawer (right side) */}
        <MapDetailsDrawer
          person={selectedPerson}
          department={selectedDepartment}
          onClose={handleCloseDrawer}
        />

        {/* Org metrics summary (top-right, compact - simplified on mobile) */}
        <div className="absolute top-4 right-4 z-20">
          <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 px-3 py-2 md:px-4 md:py-3">
            <div className="flex items-center gap-4 md:gap-6">
              {/* Total people */}
              <div className="text-center">
                <div className="text-base md:text-lg font-bold text-white">
                  {orgData.people.length}
                </div>
                <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                  People
                </div>
              </div>

              {/* Active */}
              <div className="text-center">
                <div className="text-base md:text-lg font-bold text-green-400">
                  {orgData.people.filter((p) => p.presence === "active").length}
                </div>
                <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                  Active
                </div>
              </div>

              {/* Blocked - only show if there are blocked people or on desktop */}
              {(orgData.people.filter((p) => p.presence === "blocked").length > 0) && (
                <div className="text-center">
                  <div className="text-base md:text-lg font-bold text-red-400">
                    {orgData.people.filter((p) => p.presence === "blocked").length}
                  </div>
                  <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                    Blocked
                  </div>
                </div>
              )}

              {/* Departments - hidden on mobile */}
              <div className="hidden md:block text-center">
                <div className="text-lg font-bold text-white">
                  {orgData.departments.length}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Depts
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts hint (bottom-right) - hidden on mobile */}
        <div className="absolute bottom-4 right-4 z-20 hidden md:block">
          <div className="text-[10px] text-slate-600 space-y-0.5">
            <div>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 mr-1">
                Scroll
              </kbd>
              Zoom
            </div>
            <div>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 mr-1">
                Drag
              </kbd>
              Pan
            </div>
            <div>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 mr-1">
                Click
              </kbd>
              Select
            </div>
          </div>
        </div>

        {/* Mobile controls toggle button */}
        <button
          onClick={() => setMobileControlsOpen(!mobileControlsOpen)}
          className="absolute top-20 left-4 z-30 md:hidden rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2 text-slate-400"
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Mobile tasks toggle button */}
        <button
          onClick={() => setMobileTasksOpen(!mobileTasksOpen)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 md:hidden rounded-full bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 px-4 py-2 text-sm text-slate-300 flex items-center gap-2"
        >
          <ChevronUp className="w-4 h-4" />
          View Tasks ({tasks.length})
        </button>
      </div>

      {/* Task feed region (hidden on mobile unless toggled, always visible on desktop) */}
      <div className={`${mobileTasksOpen ? 'h-full' : 'hidden'} md:block md:h-[35vh] border-t border-slate-700/50 bg-slate-900 overflow-hidden`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-none px-4 py-3 border-b border-slate-700/50 bg-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Mobile close button */}
                <button
                  onClick={() => setMobileTasksOpen(false)}
                  className="md:hidden p-1 text-slate-400 hover:text-white"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-sm font-semibold text-white">Company Tasks</h2>
                  {(filterTeamId || filterPersonId) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {filterPersonId && `Filtered by: ${selectedPerson?.name}`}
                      {filterTeamId && !filterPersonId && `Filtered by: ${selectedDepartment?.name}`}
                      {" · "}
                      <button
                        onClick={() => {
                          setFilterTeamId(null);
                          setFilterPersonId(null);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Clear
                      </button>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {tasks.length} total tasks
              </div>
            </div>
          </div>

          {/* Task feed */}
          <div className="flex-1 min-h-0">
            <TaskFeed
              tasks={tasks}
              onTaskClick={handleTaskClick}
              selectedTaskId={selectedTask?.id}
              density={density}
              filterTeamId={filterTeamId}
              filterPersonId={filterPersonId}
            />
          </div>
        </div>
      </div>

      {/* Task details drawer */}
      {selectedTask && (
        <TaskDetailsDrawer
          task={selectedTask}
          onClose={handleCloseTaskDrawer}
          onRunAgent={handleRunAgent}
        />
      )}

      {/* Build version indicator */}
      <BuildVersion />
    </div>
  );
}
