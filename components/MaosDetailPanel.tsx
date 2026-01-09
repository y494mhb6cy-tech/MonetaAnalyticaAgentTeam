"use client";

import { Agent, Personnel } from "../lib/maos-types";
import { Badge, Button, Card } from "./ui";

const ActivityList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 text-xs text-slate-300">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2">
        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-500/80" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export function PersonnelDetailPanel({
  person,
  onClose,
  onViewMap,
  showViewOnMap = false
}: {
  person: Personnel;
  onClose?: () => void;
  onViewMap?: () => void;
  showViewOnMap?: boolean;
}) {
  const activity = [
    `Reviewed ${person.metrics.callsWeek} weekly calls for ${person.team}.`,
    `Logged ${person.metrics.salesWeek} weekly sales motions.`,
    "Updated operating priorities for next sprint."
  ];

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Personnel</div>
          <div className="text-xl font-semibold text-white">{person.name}</div>
          <div className="text-sm text-slate-300">{person.title}</div>
        </div>
        {onClose ? (
          <Button variant="ghost" onClick={onClose} className="px-2 py-1">
            Close
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={person.team} />
        <Badge label={person.positionLevel} />
        <Badge label={person.status} />
        <span className="text-xs text-slate-400">Capacity</span>
        <span className="text-sm text-white">{person.capacity}%</span>
      </div>
      <div className="grid gap-3 text-sm text-slate-300">
        <div>
          <div className="text-xs uppercase text-slate-500">Primary responsibilities</div>
          <div className="mt-1 text-sm text-slate-200">{person.primaryResponsibilities.join(" · ")}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-500">Primary tasks</div>
          <div className="mt-1 text-sm text-slate-200">{person.primaryTasks.join(" · ")}</div>
        </div>
      </div>
      <div className="grid gap-4 rounded-xl border border-white/5 bg-ink-900/60 p-4 text-sm">
        <div className="text-xs uppercase text-slate-500">Weekly metrics</div>
        <div className="grid grid-cols-2 gap-3 text-slate-200">
          <div>
            <div className="text-xs text-slate-400">Calls (week)</div>
            <div className="text-lg font-semibold">{person.metrics.callsWeek}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Sales (week)</div>
            <div className="text-lg font-semibold">{person.metrics.salesWeek}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Revenue (week)</div>
            <div className="text-lg font-semibold">${person.metrics.revenueWeek.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Calls (today)</div>
            <div className="text-lg font-semibold">{person.metrics.callsToday}</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs uppercase text-slate-500">Recent activity</div>
        <ActivityList items={activity} />
      </div>
      {showViewOnMap && onViewMap ? (
        <Button onClick={onViewMap} className="w-full">
          View on map
        </Button>
      ) : null}
    </Card>
  );
}

export function AgentDetailPanel({
  agent,
  onClose,
  onViewMap,
  showViewOnMap = false
}: {
  agent: Agent;
  onClose?: () => void;
  onViewMap?: () => void;
  showViewOnMap?: boolean;
}) {
  const activity = [
    `Processed ${agent.metrics.runsWeek} runs this week for ${agent.ownerTeam}.`,
    `Maintained ${agent.metrics.successRate}% success rate.`,
    "Queued new optimization cycle for next shift."
  ];

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Agent</div>
          <div className="text-xl font-semibold text-white">{agent.name}</div>
          <div className="text-sm text-slate-300">{agent.purpose}</div>
        </div>
        {onClose ? (
          <Button variant="ghost" onClick={onClose} className="px-2 py-1">
            Close
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={agent.module} />
        <Badge label={agent.ownerTeam} />
        <Badge label={agent.status} />
        <span className="text-xs text-slate-400">Utilization</span>
        <span className="text-sm text-white">{agent.utilization}%</span>
      </div>
      <div className="grid gap-3 text-sm text-slate-300">
        <div>
          <div className="text-xs uppercase text-slate-500">Inputs</div>
          <div className="mt-1 text-sm text-slate-200">{agent.inputs.join(" · ")}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-slate-500">Outputs</div>
          <div className="mt-1 text-sm text-slate-200">{agent.outputs.join(" · ")}</div>
        </div>
      </div>
      <div className="grid gap-4 rounded-xl border border-white/5 bg-ink-900/60 p-4 text-sm">
        <div className="text-xs uppercase text-slate-500">Weekly metrics</div>
        <div className="grid grid-cols-2 gap-3 text-slate-200">
          <div>
            <div className="text-xs text-slate-400">Runs (week)</div>
            <div className="text-lg font-semibold">{agent.metrics.runsWeek}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Success rate</div>
            <div className="text-lg font-semibold">{agent.metrics.successRate}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Runs (today)</div>
            <div className="text-lg font-semibold">{agent.metrics.runsToday}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Avg latency</div>
            <div className="text-lg font-semibold">{agent.metrics.avgLatencyMs}ms</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs uppercase text-slate-500">Recent activity</div>
        <ActivityList items={activity} />
      </div>
      {showViewOnMap && onViewMap ? (
        <Button onClick={onViewMap} className="w-full">
          View on map
        </Button>
      ) : null}
    </Card>
  );
}
