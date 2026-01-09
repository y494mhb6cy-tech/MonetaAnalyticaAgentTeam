"use client";

import { useMemo, useState } from "react";
import { Agent, Personnel, TaskStatus } from "../lib/maos-types";
import { useMaosStore } from "../lib/maos-store";
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

const statusOptions: TaskStatus[] = ["Backlog", "In Progress", "Blocked", "Done"];

const TaskRow = ({
  id,
  title,
  status,
  priority,
  onStatusChange
}: {
  id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm">
    <div>
      <div className="text-sm text-[color:var(--text)]">{title}</div>
      <div className="text-[11px] uppercase text-[color:var(--muted)]">{priority}</div>
    </div>
    <select
      className="rounded-md border border-[color:var(--border)] bg-[var(--panel)] px-2 py-1 text-xs text-[color:var(--text)]"
      value={status}
      onChange={(event) => onStatusChange(id, event.target.value as TaskStatus)}
    >
      {statusOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
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
  const { tasks, addTask, updateTask } = useMaosStore();
  const [showTaskComposer, setShowTaskComposer] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const personTasks = useMemo(() => tasks.filter((task) => task.ownerType === "personnel" && task.ownerId === person.id), [person.id, tasks]);
  const openTasks = personTasks.filter((task) => task.status !== "Done");
  const doneTasks = personTasks.filter((task) => task.status === "Done");
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase text-[color:var(--muted)]">Tasks</div>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setShowTaskComposer((prev) => !prev)}>
            + New Task
          </Button>
        </div>
        {showTaskComposer ? (
          <div className="space-y-2 rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] p-3">
            <input
              className="w-full rounded-md border border-[color:var(--border)] bg-[var(--panel)] px-2 py-1 text-sm text-[color:var(--text)]"
              placeholder="Task title"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
            />
            <textarea
              className="min-h-[70px] w-full rounded-md border border-[color:var(--border)] bg-[var(--panel)] px-2 py-1 text-sm text-[color:var(--text)]"
              placeholder="Description (optional)"
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
            />
            <div className="flex justify-end">
              <Button
                className="px-3 py-1 text-xs"
                disabled={!draftTitle.trim()}
                onClick={() => {
                  addTask({
                    title: draftTitle.trim(),
                    description: draftDescription.trim() || undefined,
                    ownerType: "personnel",
                    ownerId: person.id,
                    priority: "Med",
                    status: "Backlog",
                    tags: ["manual"]
                  });
                  setDraftTitle("");
                  setDraftDescription("");
                  setShowTaskComposer(false);
                }}
              >
                Add task
              </Button>
            </div>
          </div>
        ) : null}
        <div className="space-y-2">
          {openTasks.length === 0 ? <div className="text-xs text-[color:var(--muted)]">No open tasks.</div> : null}
          {openTasks.map((task) => (
            <TaskRow
              key={task.id}
              id={task.id}
              title={task.title}
              status={task.status}
              priority={task.priority}
              onStatusChange={(id, status) => {
                const next = personTasks.find((item) => item.id === id);
                if (!next) {
                  return;
                }
                updateTask({ ...next, status, updatedAt: new Date().toISOString() });
              }}
            />
          ))}
        </div>
        <details className="rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-xs text-[color:var(--muted)]">
          <summary className="cursor-pointer text-xs text-[color:var(--muted)]">Done ({doneTasks.length})</summary>
          <div className="mt-2 space-y-2">
            {doneTasks.length === 0 ? <div>No completed tasks.</div> : null}
            {doneTasks.map((task) => (
              <TaskRow
                key={task.id}
                id={task.id}
                title={task.title}
                status={task.status}
                priority={task.priority}
                onStatusChange={(id, status) => {
                  const next = personTasks.find((item) => item.id === id);
                  if (!next) {
                    return;
                  }
                  updateTask({ ...next, status, updatedAt: new Date().toISOString() });
                }}
              />
            ))}
          </div>
        </details>
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
  const { tasks, addTask, updateTask } = useMaosStore();
  const [showTaskComposer, setShowTaskComposer] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const agentTasks = useMemo(() => tasks.filter((task) => task.ownerType === "agent" && task.ownerId === agent.id), [agent.id, tasks]);
  const openTasks = agentTasks.filter((task) => task.status !== "Done");
  const doneTasks = agentTasks.filter((task) => task.status === "Done");
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase text-[color:var(--muted)]">Tasks</div>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setShowTaskComposer((prev) => !prev)}>
            + New Task
          </Button>
        </div>
        {showTaskComposer ? (
          <div className="space-y-2 rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] p-3">
            <input
              className="w-full rounded-md border border-[color:var(--border)] bg-[var(--panel)] px-2 py-1 text-sm text-[color:var(--text)]"
              placeholder="Task title"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
            />
            <textarea
              className="min-h-[70px] w-full rounded-md border border-[color:var(--border)] bg-[var(--panel)] px-2 py-1 text-sm text-[color:var(--text)]"
              placeholder="Description (optional)"
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
            />
            <div className="flex justify-end">
              <Button
                className="px-3 py-1 text-xs"
                disabled={!draftTitle.trim()}
                onClick={() => {
                  addTask({
                    title: draftTitle.trim(),
                    description: draftDescription.trim() || undefined,
                    ownerType: "agent",
                    ownerId: agent.id,
                    priority: "Med",
                    status: "Backlog",
                    tags: ["manual"]
                  });
                  setDraftTitle("");
                  setDraftDescription("");
                  setShowTaskComposer(false);
                }}
              >
                Add task
              </Button>
            </div>
          </div>
        ) : null}
        <div className="space-y-2">
          {openTasks.length === 0 ? <div className="text-xs text-[color:var(--muted)]">No open tasks.</div> : null}
          {openTasks.map((task) => (
            <TaskRow
              key={task.id}
              id={task.id}
              title={task.title}
              status={task.status}
              priority={task.priority}
              onStatusChange={(id, status) => {
                const next = agentTasks.find((item) => item.id === id);
                if (!next) {
                  return;
                }
                updateTask({ ...next, status, updatedAt: new Date().toISOString() });
              }}
            />
          ))}
        </div>
        <details className="rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-xs text-[color:var(--muted)]">
          <summary className="cursor-pointer text-xs text-[color:var(--muted)]">Done ({doneTasks.length})</summary>
          <div className="mt-2 space-y-2">
            {doneTasks.length === 0 ? <div>No completed tasks.</div> : null}
            {doneTasks.map((task) => (
              <TaskRow
                key={task.id}
                id={task.id}
                title={task.title}
                status={task.status}
                priority={task.priority}
                onStatusChange={(id, status) => {
                  const next = agentTasks.find((item) => item.id === id);
                  if (!next) {
                    return;
                  }
                  updateTask({ ...next, status, updatedAt: new Date().toISOString() });
                }}
              />
            ))}
          </div>
        </details>
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
