"use client";

import React from "react";
import { ViewToggle } from "./ViewToggle";

type TimeWindow = "24h" | "7d";

interface MapControlBarProps {
  showFlowTrace: boolean;
  timeWindow: TimeWindow;
  onToggleFlowTrace: () => void;
  onTimeWindowChange: (window: TimeWindow) => void;
}

export default function MapControlBar({
  showFlowTrace,
  timeWindow,
  onToggleFlowTrace,
  onTimeWindowChange,
}: MapControlBarProps) {
  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
      {/* View Toggle - Unified component */}
      <ViewToggle />

      {/* Overlay Controls */}
      <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 p-2 backdrop-blur-sm border border-slate-700/50">
        <button
          onClick={onToggleFlowTrace}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            showFlowTrace
              ? "bg-sky-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Flow Trace
        </button>
      </div>

      {/* Time Window (stubbed) */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 backdrop-blur-sm border border-slate-700/50">
        <button
          onClick={() => onTimeWindowChange("24h")}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            timeWindow === "24h"
              ? "bg-slate-700 text-white"
              : "text-slate-500 hover:text-white"
          }`}
        >
          24h
        </button>
        <button
          onClick={() => onTimeWindowChange("7d")}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            timeWindow === "7d"
              ? "bg-slate-700 text-white"
              : "text-slate-500 hover:text-white"
          }`}
        >
          7d
        </button>
      </div>
    </div>
  );
}
