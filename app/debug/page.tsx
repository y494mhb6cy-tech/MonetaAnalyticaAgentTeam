/**
 * Debug Route - View Audit Log
 * 
 * Shows recent audit events for debugging and observability.
 * Accessible at /debug
 */

"use client";

import { useState, useEffect } from 'react';
import { getRecentEvents, clearAuditLog, type AuditEvent } from '../../lib/audit-logger';
import { Button } from '../../components/ui';

export default function DebugPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadEvents();
    // Refresh every 2 seconds
    const interval = setInterval(loadEvents, 2000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadEvents = () => {
    const recent = getRecentEvents(50);
    if (filter === 'all') {
      setEvents(recent);
    } else {
      setEvents(recent.filter((e) => e.type === filter));
    }
  };

  const handleClear = () => {
    if (confirm('Clear all audit logs?')) {
      clearAuditLog();
      setEvents([]);
    }
  };

  const typeColors: Record<string, string> = {
    click: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    submit: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    navigate: 'bg-green-500/20 text-green-400 border-green-500/30',
    api_call: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    state_change: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    filter_change: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--text)]">Audit Log</h1>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              Recent user actions and system events (last 50)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] text-sm text-[color:var(--text)]"
            >
              <option value="all">All Types</option>
              <option value="click">Clicks</option>
              <option value="submit">Submits</option>
              <option value="navigate">Navigation</option>
              <option value="api_call">API Calls</option>
              <option value="error">Errors</option>
              <option value="state_change">State Changes</option>
              <option value="filter_change">Filter Changes</option>
            </select>
            <Button variant="ghost" onClick={handleClear}>
              Clear Log
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--border)] bg-[var(--panel)] overflow-hidden">
          {events.length === 0 ? (
            <div className="p-12 text-center text-[color:var(--muted)]">
              No events found. Interact with the app to see audit logs.
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--border)]">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 hover:bg-[var(--hover)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded border ${
                            typeColors[event.type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {event.type}
                        </span>
                        <span className="text-sm font-medium text-[color:var(--text)]">
                          {event.component}
                        </span>
                        <span className="text-sm text-[color:var(--muted)]">•</span>
                        <span className="text-sm text-[color:var(--muted)]">{event.action}</span>
                        {event.success !== undefined && (
                          <>
                            <span className="text-sm text-[color:var(--muted)]">•</span>
                            <span
                              className={`text-xs ${
                                event.success ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {event.success ? '✓' : '✗'}
                            </span>
                          </>
                        )}
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="text-xs text-[color:var(--muted)] font-mono bg-[var(--panel2)] p-2 rounded mt-2">
                          {JSON.stringify(event.metadata, null, 2)}
                        </div>
                      )}
                      {event.error && (
                        <div className="text-xs text-red-400 mt-2 font-mono bg-red-500/10 p-2 rounded">
                          {event.error}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-[color:var(--muted)] whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-[color:var(--muted)] text-center">
          Audit logs are stored in localStorage. Clear browser data to reset.
        </div>
      </div>
    </div>
  );
}
