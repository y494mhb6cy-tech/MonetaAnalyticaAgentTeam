"use client";

import React, { useState, useCallback, ReactNode, useMemo } from "react";
import { ViewToggle } from "./ViewToggle";
import MapLegend from "./MapLegend";
import { BuildVersion } from "./BuildVersion";
import { Layers, ChevronUp, ChevronDown, Filter, X } from "lucide-react";
import clsx from "clsx";

export type TimeWindow = "24h" | "7d";

interface MapMetrics {
  total: number;
  totalLabel: string;
  active: number;
  activeLabel: string;
  blocked?: number;
  blockedLabel?: string;
  extra?: number;
  extraLabel?: string;
}

interface MapShellProps {
  children: ReactNode;

  // Metrics panel data
  metrics?: MapMetrics;

  // Control bar section (appears below ViewToggle)
  controlBar?: ReactNode;

  // Left side controls (appears below control bar)
  leftControls?: ReactNode;

  // Left filter panel (for agents page - appears as sidebar)
  filterPanel?: ReactNode;
  showFilterPanel?: boolean;
  onToggleFilterPanel?: () => void;

  // Right panel (details drawer, etc.)
  rightPanel?: ReactNode;

  // Bottom panel (task feed for personnel)
  bottomPanel?: ReactNode;
  bottomPanelLabel?: string;
  bottomPanelCount?: number;

  // Show legend
  showLegend?: boolean;

  // Mobile controls
  mobileControlsOpen?: boolean;
  onToggleMobileControls?: () => void;

  // Custom className for the canvas container
  canvasContainerClassName?: string;
}

/**
 * MapShell - Shared layout component for both /map and /map/agents pages.
 * Provides consistent UI chrome including:
 * - ViewToggle (top-left)
 * - Control bar and left controls (top-left, below toggle)
 * - Metrics summary (top-right)
 * - Legend (bottom-left)
 * - Keyboard shortcuts hint (bottom-right, desktop only)
 * - Mobile controls toggle
 * - BuildVersion indicator
 */
export function MapShell({
  children,
  metrics,
  controlBar,
  leftControls,
  filterPanel,
  showFilterPanel = true,
  onToggleFilterPanel,
  rightPanel,
  bottomPanel,
  bottomPanelLabel = "Items",
  bottomPanelCount = 0,
  showLegend = true,
  mobileControlsOpen = false,
  onToggleMobileControls,
  canvasContainerClassName,
}: MapShellProps) {
  const [mobileBottomPanelOpen, setMobileBottomPanelOpen] = useState(false);

  const handleToggleMobileBottomPanel = useCallback(() => {
    setMobileBottomPanelOpen((prev) => !prev);
  }, []);

  // Determine if we have a filter panel layout (agents) vs standard layout (personnel)
  const hasFilterPanel = !!filterPanel;

  return (
    <div className="h-[calc(100vh-52px)] w-full flex flex-col bg-slate-950 overflow-hidden pb-16 md:pb-0">
      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left filter panel (for agents page) */}
        {hasFilterPanel && showFilterPanel && (
          <div className="w-80 bg-slate-900 border-r border-slate-700/50 flex flex-col hidden md:flex overflow-hidden">
            {filterPanel}
          </div>
        )}

        {/* Map region */}
        <div
          className={clsx(
            "flex-1 min-h-0 relative",
            mobileBottomPanelOpen && bottomPanel ? "hidden md:block" : ""
          )}
        >
          {/* Canvas container */}
          <div className={clsx("absolute inset-0", canvasContainerClassName)}>
            {children}
          </div>

          {/* Top-left controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {/* View Toggle - Always present */}
            <ViewToggle />

            {/* Control bar (optional - e.g., flow trace, time window) */}
            {controlBar}
          </div>

          {/* Enhanced controls (top-left, below control bar) - hidden on mobile by default */}
          {leftControls && (
            <div
              className={clsx(
                "absolute top-20 left-4 z-20 space-y-2",
                mobileControlsOpen ? "block" : "hidden md:block"
              )}
              style={{ top: controlBar ? "140px" : "80px" }}
            >
              {leftControls}
            </div>
          )}

          {/* Filter panel toggle button (mobile + collapsed state) */}
          {hasFilterPanel && !showFilterPanel && (
            <button
              onClick={onToggleFilterPanel}
              className="absolute top-4 left-4 z-20 p-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg hover:bg-slate-800"
              aria-label="Show filters"
            >
              <Filter className="w-5 h-5 text-slate-400" />
            </button>
          )}

          {/* Mobile filter panel (slide in) */}
          {hasFilterPanel && showFilterPanel && (
            <div className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm">
              <div className="absolute left-0 top-0 bottom-16 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-700/50 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                  <h2 className="text-lg font-semibold text-white">Filters</h2>
                  <button
                    onClick={onToggleFilterPanel}
                    className="p-1 hover:bg-slate-800 rounded"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">{filterPanel}</div>
              </div>
            </div>
          )}

          {/* Legend (bottom-left) */}
          {showLegend && <MapLegend />}

          {/* Metrics summary (top-right) */}
          {metrics && (
            <div className="absolute top-4 right-4 z-20">
              <div className="rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 px-3 py-2 md:px-4 md:py-3">
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Total */}
                  <div className="text-center">
                    <div className="text-base md:text-lg font-bold text-white">
                      {metrics.total}
                    </div>
                    <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                      {metrics.totalLabel}
                    </div>
                  </div>

                  {/* Active */}
                  <div className="text-center">
                    <div className="text-base md:text-lg font-bold text-green-400">
                      {metrics.active}
                    </div>
                    <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                      {metrics.activeLabel}
                    </div>
                  </div>

                  {/* Blocked (optional) */}
                  {metrics.blocked !== undefined && metrics.blocked > 0 && (
                    <div className="text-center">
                      <div className="text-base md:text-lg font-bold text-red-400">
                        {metrics.blocked}
                      </div>
                      <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                        {metrics.blockedLabel}
                      </div>
                    </div>
                  )}

                  {/* Extra (optional) - hidden on mobile */}
                  {metrics.extra !== undefined && (
                    <div className="hidden md:block text-center">
                      <div className="text-lg font-bold text-white">
                        {metrics.extra}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        {metrics.extraLabel}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Keyboard shortcuts hint (bottom-right, desktop only) */}
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

          {/* Mobile controls toggle button (when leftControls exist) */}
          {leftControls && onToggleMobileControls && (
            <button
              onClick={onToggleMobileControls}
              className="absolute top-20 left-4 z-30 md:hidden rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 p-2 text-slate-400"
              style={{ top: controlBar ? "140px" : "80px" }}
              aria-label={mobileControlsOpen ? "Hide controls" : "Show controls"}
            >
              <Layers className="w-5 h-5" />
            </button>
          )}

          {/* Mobile bottom panel toggle button */}
          {bottomPanel && (
            <button
              onClick={handleToggleMobileBottomPanel}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 md:hidden rounded-full bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 px-4 py-2 text-sm text-slate-300 flex items-center gap-2"
              aria-label={`View ${bottomPanelLabel}`}
            >
              <ChevronUp className="w-4 h-4" />
              View {bottomPanelLabel} ({bottomPanelCount})
            </button>
          )}

          {/* Right panel (details drawer) */}
          {rightPanel}
        </div>
      </div>

      {/* Bottom panel (task feed, etc.) - hidden on mobile unless toggled */}
      {bottomPanel && (
        <div
          className={clsx(
            "md:block md:h-[35vh] border-t border-slate-700/50 bg-slate-900 overflow-hidden",
            mobileBottomPanelOpen ? "h-full" : "hidden"
          )}
        >
          <div className="h-full flex flex-col">
            {/* Mobile close button */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800">
              <span className="text-sm font-semibold text-white">
                {bottomPanelLabel}
              </span>
              <button
                onClick={handleToggleMobileBottomPanel}
                className="p-1 text-slate-400 hover:text-white"
                aria-label="Close panel"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">{bottomPanel}</div>
          </div>
        </div>
      )}

      {/* Build version indicator */}
      <BuildVersion />
    </div>
  );
}

export default MapShell;
