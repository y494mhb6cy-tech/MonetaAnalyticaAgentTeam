"use client";

import React from "react";
import Link from "next/link";

export default function AgentArchitecturePage() {
  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col">
      {/* Control bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 backdrop-blur-sm border border-slate-700/50">
          <Link
            href="/map"
            className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Personnel
          </Link>
          <Link
            href="/map/agents"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white transition-colors"
          >
            Agents
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          {/* Icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Agent Architecture
          </h1>

          {/* Description */}
          <p className="text-slate-400 mb-8 leading-relaxed">
            The Agent Architecture view shows the relationships between autonomous
            agents, their modules, data flows, and dependencies. This view is designed
            for technical operations and system monitoring.
          </p>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-slate-300">Coming Soon</span>
          </div>

          {/* Features list */}
          <div className="mt-8 text-left">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">
              Planned Features
            </div>
            <ul className="space-y-2">
              {[
                "Agent dependency graph visualization",
                "Real-time data flow monitoring",
                "Module status and health indicators",
                "Performance metrics overlay",
                "Error trace visualization",
              ].map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-sm text-slate-400"
                >
                  <svg
                    className="w-4 h-4 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Back link */}
          <div className="mt-8">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to Personnel Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
