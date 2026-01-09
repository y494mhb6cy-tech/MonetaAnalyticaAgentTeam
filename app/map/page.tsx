"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { OrgPerson, OrgDepartment, OrgMapData } from "../../lib/maos-types";
import { defaultOrgData } from "../../lib/org-map-data";
import MapControlBar from "../../components/MapControlBar";
import MapLegend from "../../components/MapLegend";
import MapDetailsDrawer from "../../components/MapDetailsDrawer";
import MapTooltip from "../../components/MapTooltip";

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

  // Selection state
  const [selectedPerson, setSelectedPerson] = useState<OrgPerson | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<OrgDepartment | null>(null);

  // Hover state for tooltip
  const [hoveredPerson, setHoveredPerson] = useState<{
    person: OrgPerson;
    x: number;
    y: number;
  } | null>(null);

  // Use default data (100 people) - can scale up to 1000 with generateOrgMapData(1000)
  const orgData = useMemo<OrgMapData>(() => defaultOrgData, []);

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
    }
  }, []);

  const handleSelectDepartment = useCallback((dept: OrgDepartment | null) => {
    setSelectedDepartment(dept);
    if (dept) {
      setSelectedPerson(null);
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

  // Determine focused department from selection
  const focusedDepartmentId = useMemo(() => {
    if (selectedDepartment) return selectedDepartment.id;
    if (selectedPerson) return selectedPerson.departmentId;
    return null;
  }, [selectedDepartment, selectedPerson]);

  return (
    <div className="h-screen w-full bg-slate-950 overflow-hidden relative">
      {/* Main canvas container */}
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
        />
      </div>

      {/* Control bar (top-left) */}
      <MapControlBar
        viewMode="personnel"
        showFlowTrace={showFlowTrace}
        timeWindow={timeWindow}
        onToggleFlowTrace={handleToggleFlowTrace}
        onTimeWindowChange={handleTimeWindowChange}
      />

      {/* Legend (bottom-left) */}
      <MapLegend />

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

      {/* Org metrics summary (top-right, compact) */}
      <div className="absolute top-4 right-4 z-20">
        <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 px-4 py-3">
          <div className="flex items-center gap-6">
            {/* Total people */}
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {orgData.people.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                People
              </div>
            </div>

            {/* Departments */}
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {orgData.departments.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Depts
              </div>
            </div>

            {/* Active */}
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {orgData.people.filter((p) => p.presence === "active").length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Active
              </div>
            </div>

            {/* Blocked */}
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">
                {orgData.people.filter((p) => p.presence === "blocked").length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Blocked
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint (bottom-right) */}
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
    </div>
  );
}
