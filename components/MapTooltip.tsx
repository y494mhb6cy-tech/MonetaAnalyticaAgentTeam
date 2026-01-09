"use client";

import React from "react";
import type { OrgPerson, PersonnelPresence } from "../lib/maos-types";

interface MapTooltipProps {
  person: OrgPerson | null;
  x: number;
  y: number;
}

function getPresenceLabel(presence: PersonnelPresence): string {
  switch (presence) {
    case "offline":
      return "Offline";
    case "online":
      return "Online";
    case "active":
      return "Active";
    case "blocked":
      return "Blocked";
  }
}

function getPresenceDotClass(presence: PersonnelPresence): string {
  switch (presence) {
    case "offline":
      return "bg-slate-500";
    case "online":
      return "bg-blue-400";
    case "active":
      return "bg-green-400 animate-pulse";
    case "blocked":
      return "bg-red-400 animate-pulse";
  }
}

export default function MapTooltip({ person, x, y }: MapTooltipProps) {
  if (!person) return null;

  // Adjust position to prevent going off screen
  const tooltipWidth = 180;
  const tooltipHeight = 80;
  const padding = 12;

  let adjustedX = x + padding;
  let adjustedY = y + padding;

  // Check if tooltip would go off right edge (assume viewport width ~1200)
  if (adjustedX + tooltipWidth > window.innerWidth - 100) {
    adjustedX = x - tooltipWidth - padding;
  }

  // Check if tooltip would go off bottom edge
  if (adjustedY + tooltipHeight > window.innerHeight - 50) {
    adjustedY = y - tooltipHeight - padding;
  }

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: adjustedX,
        top: adjustedY,
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            {person.avatarInitials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {person.name}
            </div>
            <div className="text-xs text-slate-400 truncate">{person.role}</div>
          </div>
        </div>

        {/* Status and score */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${getPresenceDotClass(person.presence)}`} />
            <span className="text-slate-400">{getPresenceLabel(person.presence)}</span>
          </div>
          {person.leverageScore > 80 && (
            <div className="flex items-center gap-1 text-amber-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              High
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
