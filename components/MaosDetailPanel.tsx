"use client";

import { Agent, Personnel } from "../lib/maos-types";
import { Badge, Button, Card } from "./ui";

const ActivityList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 text-xs text-[color:var(--muted)]">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2">
        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]/80" />
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
    person.metrics.sales
      ? `Reviewed ${person.metrics.sales.callsWeek} weekly sales calls.`
      : person.metrics.ops
        ? `Completed ${person.metrics.ops.jobsCompletedToday} jobs today.`
        : person.metrics.finance
          ? `Processed ${person.metrics.finance.invoicesProcessedToday} invoices today.`
          : "Aligned executive operating priorities.",
    person.metrics.sales
      ? `Closed ${person.metrics.sales.salesWeek} weekly sales motions.`
      : person.metrics.ops
        ? `Backlog at ${person.metrics.ops.backlog} items.`
        : person.metrics.finance
          ? `${person.metrics.finance.closeTasksOpen} close tasks remain open.`
          : "Reviewed strategic initiatives for next sprint.",
    "Updated operating priorities for next sprint."
  ];

  const metricsBlock = person.metrics.sales
    ? {
        title: "Sales performance",
        items: [
          { label: "Calls (today)", value: person.metrics.sales.callsToday },
          { label: "Calls (week)", value: person.metrics.sales.callsWeek },
          { label: "Sales (week)", value: person.metrics.sales.salesWeek },
          { label: "Revenue (week)", value: `$${person.metrics.sales.revenueWeek.toLocaleString()}` }
        ]
      }
    : person.metrics.ops
      ? {
          title: "Operations throughput",
          items: [
            { label: "Jobs scheduled", value: person.metrics.ops.jobsScheduledToday },
            { label: "Jobs completed", value: person.metrics.ops.jobsCompletedToday },
            { label: "Backlog", value: person.metrics.ops.backlog },
            { label: "Overtime hours", value: person.metrics.ops.overtimeHoursWeek }
          ]
        }
      : person.metrics.finance
        ? {
            title: "Finance controls",
            items: [
              { label: "Invoices processed", value: person.metrics.finance.invoicesProcessedToday },
              { label: "A/R calls (week)", value: person.metrics.finance.ARCallsWeek },
              { label: "Close tasks open", value: person.metrics.finance.closeTasksOpen },
              { label: "Days to close", value: person.metrics.finance.daysToCloseEstimate }
            ]
          }
        : null;

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Personnel</div>
          <div className="text-xl font-semibold text-[color:var(--text)]">{person.name}</div>
          <div className="text-sm text-[color:var(--muted)]">{person.title}</div>
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
        <span className="text-xs text-[color:var(--muted)]">Capacity</span>
        <span className="text-sm text-[color:var(--text)]">{person.capacity}%</span>
      </div>
      <div className="grid gap-3 text-sm text-[color:var(--muted)]">
        <div>
          <div className="text-xs uppercase text-[color:var(--muted)]">Primary responsibilities</div>
          <div className="mt-1 text-sm text-[color:var(--text)]">{person.primaryResponsibilities.join(" · ")}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-[color:var(--muted)]">Primary tasks</div>
          <div className="mt-1 text-sm text-[color:var(--text)]">{person.primaryTasks.join(" · ")}</div>
        </div>
      </div>
      {metricsBlock ? (
        <div className="grid gap-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel2)] p-4 text-sm">
          <div className="text-xs uppercase text-[color:var(--muted)]">{metricsBlock.title}</div>
          <div className="grid grid-cols-2 gap-3 text-[color:var(--text)]">
            {metricsBlock.items.map((item) => (
              <div key={item.label}>
                <div className="text-xs text-[color:var(--muted)]">{item.label}</div>
                <div className="text-lg font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        <div className="text-xs uppercase text-[color:var(--muted)]">Recent activity</div>
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
          <div className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Agent</div>
          <div className="text-xl font-semibold text-[color:var(--text)]">{agent.name}</div>
          <div className="text-sm text-[color:var(--muted)]">{agent.purpose}</div>
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
        <span className="text-xs text-[color:var(--muted)]">Utilization</span>
        <span className="text-sm text-[color:var(--text)]">{agent.utilization}%</span>
      </div>
      <div className="grid gap-3 text-sm text-[color:var(--muted)]">
        <div>
          <div className="text-xs uppercase text-[color:var(--muted)]">Inputs</div>
          <div className="mt-1 text-sm text-[color:var(--text)]">{agent.inputs.join(" · ")}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-[color:var(--muted)]">Outputs</div>
          <div className="mt-1 text-sm text-[color:var(--text)]">{agent.outputs.join(" · ")}</div>
        </div>
      </div>
      <div className="grid gap-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel2)] p-4 text-sm">
        <div className="text-xs uppercase text-[color:var(--muted)]">Performance metrics</div>
        <div className="grid grid-cols-2 gap-3 text-[color:var(--text)]">
          <div>
            <div className="text-xs text-[color:var(--muted)]">Runs (week)</div>
            <div className="text-lg font-semibold">{agent.metrics.runsWeek}</div>
          </div>
          <div>
            <div className="text-xs text-[color:var(--muted)]">Success rate</div>
            <div className="text-lg font-semibold">{agent.metrics.successRate}%</div>
          </div>
          <div>
            <div className="text-xs text-[color:var(--muted)]">Runs (today)</div>
            <div className="text-lg font-semibold">{agent.metrics.runsToday}</div>
          </div>
          <div>
            <div className="text-xs text-[color:var(--muted)]">Error rate</div>
            <div className="text-lg font-semibold">{agent.metrics.errorRate}%</div>
          </div>
          <div>
            <div className="text-xs text-[color:var(--muted)]">Avg latency</div>
            <div className="text-lg font-semibold">{agent.metrics.avgLatencyMs}ms</div>
          </div>
          <div>
            <div className="text-xs text-[color:var(--muted)]">Last run</div>
            <div className="text-lg font-semibold">{new Date(agent.metrics.lastRunAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs uppercase text-[color:var(--muted)]">Recent activity</div>
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
