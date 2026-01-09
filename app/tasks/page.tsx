"use client";

import { useMemo, useState } from "react";
import { PageHeader, Card, Badge, Select, Button } from "../../components/ui";
import { SectionLayout } from "../../components/SectionLayout";
import { useMaosStore } from "../../lib/maos-store";
import { TaskStatus } from "../../lib/maos-types";

const statusOrder: TaskStatus[] = ["Backlog", "In Progress", "Blocked", "Done"];

export default function TasksPage() {
  const { tasks, personnel, agents, updateTask } = useMaosStore();
  const [view, setView] = useState<"queue" | "all">("queue");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "personnel" | "agent">("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const teams = useMemo(() => Array.from(new Set(personnel.map((person) => person.team))).sort(), [personnel]);
  const modules = useMemo(() => Array.from(new Set(agents.map((agent) => agent.module))).sort(), [agents]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (view === "queue" && task.status === "Done") {
        return false;
      }
      if (ownerFilter !== "all" && task.ownerType !== ownerFilter) {
        return false;
      }
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }
      if (task.ownerType === "personnel" && teamFilter !== "all") {
        const owner = personnel.find((person) => person.id === task.ownerId);
        if (!owner || owner.team !== teamFilter) {
          return false;
        }
      }
      if (task.ownerType === "agent" && moduleFilter !== "all") {
        const owner = agents.find((agent) => agent.id === task.ownerId);
        if (!owner || owner.module !== moduleFilter) {
          return false;
        }
      }
      return true;
    });
  }, [agents, moduleFilter, ownerFilter, personnel, priorityFilter, tasks, teamFilter, view]);

  const grouped = useMemo(() => {
    return statusOrder.map((status) => ({
      status,
      tasks: filteredTasks.filter((task) => task.status === status)
    }));
  }, [filteredTasks]);

  return (
    <SectionLayout
      sidebar={
        <div className="space-y-4 text-sm text-[color:var(--muted)]">
          <div>
            <div className="text-xs uppercase tracking-[0.18em]">Tasks</div>
            <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">Queue filters</div>
          </div>
          <Select label="Owner type" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value as "all" | "personnel" | "agent")}>
            <option value="all">All owners</option>
            <option value="personnel">Personnel</option>
            <option value="agent">Agents</option>
          </Select>
          <Select label="Team" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
            <option value="all">All teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </Select>
          <Select label="Agent module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
            <option value="all">All modules</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </Select>
          <Select label="Priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="all">All priorities</option>
            <option value="Low">Low</option>
            <option value="Med">Med</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </Select>
          <div className="flex gap-2">
            <Button variant="ghost" className={view === "queue" ? "border-[color:var(--accent)]" : ""} onClick={() => setView("queue")}>
              Queue
            </Button>
            <Button variant="ghost" className={view === "all" ? "border-[color:var(--accent)]" : ""} onClick={() => setView("all")}>
              All
            </Button>
          </div>
        </div>
      }
      detail={
        <Card className="space-y-3 text-sm text-[color:var(--muted)]">
          <div className="text-xs uppercase tracking-[0.16em]">Queue summary</div>
          <div className="flex flex-wrap gap-2">
            {grouped.map((group) => (
              <Badge key={group.status} label={`${group.status}: ${group.tasks.length}`} />
            ))}
          </div>
        </Card>
      }
    >
      <div className="space-y-6">
        <PageHeader title="Tasks" subtitle="Track open queues for personnel and agents." />
        <div className="grid gap-4 lg:grid-cols-2">
          {grouped.map((group) => (
            <Card key={group.status} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[color:var(--text)]">{group.status}</div>
                <Badge label={`${group.tasks.length} tasks`} />
              </div>
              <div className="space-y-2">
                {group.tasks.length === 0 ? (
                  <div className="text-xs text-[color:var(--muted)]">No tasks in this lane.</div>
                ) : (
                  group.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm">
                      <div>
                        <div className="text-sm text-[color:var(--text)]">{task.title}</div>
                        <div className="text-[11px] text-[color:var(--muted)]">
                          {task.ownerType === "personnel"
                            ? personnel.find((person) => person.id === task.ownerId)?.name ?? "Personnel"
                            : agents.find((agent) => agent.id === task.ownerId)?.name ?? "Agent"}
                          {" · "}
                          {task.priority}
                        </div>
                      </div>
                      <select
                        className="rounded-md border border-[color:var(--border)] bg-[var(--panel)] px-2 py-1 text-xs text-[color:var(--text)]"
                        value={task.status}
                        onChange={(event) => updateTask({ ...task, status: event.target.value as TaskStatus, updatedAt: new Date().toISOString() })}
                      >
                        {statusOrder.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SectionLayout>
  );
}
