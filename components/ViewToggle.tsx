"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Cpu, RefreshCw } from "lucide-react";
import clsx from "clsx";

export type ViewMode = "personnel" | "agents";

interface ViewToggleProps {
  className?: string;
}

/**
 * Unified toggle component for switching between Personnel and Agents views.
 * Used by both the Personnel map page and Agents map page to ensure
 * consistent visual appearance and behavior.
 *
 * Features:
 * - Rotating icon animation when switching views
 * - URL-based state persistence (works with browser back/forward)
 * - Consistent hover/active/focus states
 * - Accessible keyboard navigation
 */
export function ViewToggle({ className }: ViewToggleProps) {
  const pathname = usePathname();

  // Determine current view from URL path
  const currentView: ViewMode = pathname.includes("/map/agents") ? "agents" : "personnel";

  return (
    <div
      className={clsx(
        "flex items-center gap-1 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-1",
        className
      )}
      role="tablist"
      aria-label="View mode toggle"
    >
      <Link
        href="/map"
        role="tab"
        aria-selected={currentView === "personnel"}
        aria-label="Personnel view"
        className={clsx(
          "group relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
          currentView === "personnel"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        )}
      >
        <Users className="w-3.5 h-3.5" />
        <span>Personnel</span>
        {/* Rotating indicator for active state */}
        <RefreshCw
          className={clsx(
            "w-3 h-3 transition-all duration-500",
            currentView === "personnel"
              ? "opacity-100 animate-spin-slow"
              : "opacity-0 scale-75"
          )}
          style={{
            animationDuration: currentView === "personnel" ? "3s" : "0s",
            animationIterationCount: "1",
          }}
        />
      </Link>

      <Link
        href="/map/agents"
        role="tab"
        aria-selected={currentView === "agents"}
        aria-label="Agents view"
        className={clsx(
          "group relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
          currentView === "agents"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        )}
      >
        <Cpu className="w-3.5 h-3.5" />
        <span>Agents</span>
        {/* Rotating indicator for active state */}
        <RefreshCw
          className={clsx(
            "w-3 h-3 transition-all duration-500",
            currentView === "agents"
              ? "opacity-100 animate-spin-slow"
              : "opacity-0 scale-75"
          )}
          style={{
            animationDuration: currentView === "agents" ? "3s" : "0s",
            animationIterationCount: "1",
          }}
        />
      </Link>
    </div>
  );
}

export default ViewToggle;
