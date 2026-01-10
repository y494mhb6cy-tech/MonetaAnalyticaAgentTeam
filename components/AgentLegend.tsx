"use client";

import React, { useState } from "react";

const AGENT_STATES = [
  { label: "Healthy", color: "#22c55e", description: "Running normally" },
  { label: "Warning", color: "#f59e0b", description: "Performance degraded" },
  { label: "Critical", color: "#ef4444", description: "Needs attention" },
  { label: "Offline", color: "rgba(100, 116, 139, 0.6)", description: "Not running" },
];

const CRITICALITY_LEVELS = [
  { label: "Low", color: "#64748b" },
  { label: "Medium", color: "#3b82f6" },
  { label: "High", color: "#f59e0b" },
  { label: "Critical", color: "#ef4444" },
];

export default function AgentLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-20">
      <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
        {/* Header toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50 transition-colors"
        >
          <span>Legend</span>
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50">
            {/* Agent states */}
            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                Agent Status
              </div>
              <div className="space-y-1.5">
                {AGENT_STATES.map((state) => (
                  <div key={state.label} className="flex items-center gap-2">
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      {/* Main dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: state.color }}
                      />
                    </div>
                    <span className="text-xs text-slate-300">{state.label}</span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      {state.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Criticality levels */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                Criticality
              </div>
              <div className="flex gap-3 flex-wrap">
                {CRITICALITY_LEVELS.map((level) => (
                  <div key={level.label} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="text-xs text-slate-300">{level.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zoom hint */}
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/30">
              Scroll to zoom, drag to pan
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
