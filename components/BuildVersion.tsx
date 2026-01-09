"use client";

import React, { useState } from "react";

export function BuildVersion() {
  const [expanded, setExpanded] = useState(false);

  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || "unknown";
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || "unknown";

  const formatTimestamp = (isoString: string) => {
    if (isoString === "unknown") return "unknown";
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed bottom-2 right-2 z-50">
      <div
        className="rounded-lg bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 px-3 py-1.5 cursor-pointer hover:bg-slate-900/95 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Build:</span>
              <span className="font-mono text-slate-300">{buildId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Time:</span>
              <span className="font-mono text-slate-300">{formatTimestamp(buildTimestamp)}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-mono">
            v{buildId}
          </div>
        )}
      </div>
    </div>
  );
}
