"use client";

import React, { useState } from "react";

const NODE_STATES = [
  { label: "Offline", color: "rgba(100, 116, 139, 0.4)", description: "Not logged in" },
  { label: "Online", color: "#3b82f6", glow: true, description: "Available" },
  { label: "Active", color: "#22c55e", pulse: true, description: "Working on task" },
  { label: "Blocked", color: "#ef4444", breathing: true, description: "Waiting on dependency" },
  { label: "High-leverage", color: "#3b82f6", goldEdge: true, description: "Key contributor" },
];

const FLOW_HEALTH = [
  { label: "Healthy", color: "#22c55e" },
  { label: "Warning", color: "#f59e0b" },
  { label: "Critical", color: "#ef4444" },
];

export default function MapLegend() {
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
            {/* Node states */}
            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                Personnel Status
              </div>
              <div className="space-y-1.5">
                {NODE_STATES.map((state) => (
                  <div key={state.label} className="flex items-center gap-2">
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      {/* Glow/pulse/breathing effects */}
                      {state.glow && (
                        <div
                          className="absolute inset-0 rounded-full opacity-40"
                          style={{ backgroundColor: state.color, filter: "blur(2px)" }}
                        />
                      )}
                      {state.pulse && (
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-30"
                          style={{ backgroundColor: state.color }}
                        />
                      )}
                      {state.breathing && (
                        <div
                          className="absolute inset-0 rounded-full animate-pulse opacity-40"
                          style={{ backgroundColor: state.color }}
                        />
                      )}
                      {/* Main dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full relative z-10"
                        style={{
                          backgroundColor: state.color,
                          boxShadow: state.goldEdge
                            ? "0 0 0 1.5px #fbbf24"
                            : undefined,
                        }}
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

            {/* Flow health */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                Flow Health
              </div>
              <div className="flex gap-3">
                {FLOW_HEALTH.map((health) => (
                  <div key={health.label} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: health.color }}
                    />
                    <span className="text-xs text-slate-300">{health.label}</span>
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
