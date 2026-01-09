"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PersonnelDetailPanel } from "../../components/MaosDetailPanel";
import { Badge, Button, Card, Input, PageHeader, Select } from "../../components/ui";
import { SectionLayout } from "../../components/SectionLayout";
import { RecentEntities } from "../../components/RecentEntities";
import { Personnel, PersonnelStatus } from "../../lib/maos-types";
import { useMaosStore } from "../../lib/maos-store";
import { salesOrgData } from "../../lib/sales-mock-data";
import { Circle, Users } from "lucide-react";

const statusOptions: PersonnelStatus[] = ["Available", "On Call", "Offline"];

// Status light colors
const statusLightColors: Record<PersonnelStatus, string> = {
  Available: "bg-green-500",
  "On Call": "bg-blue-500",
  Offline: "bg-gray-400",
};

function PersonnelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { personnel, addPersonnel, addRecentEntity } = useMaosStore();
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityMin, setCapacityMin] = useState(0);
  const [capacityMax, setCapacityMax] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(personnel[0]?.id ?? null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Create lookup for org hierarchy data
  const orgPeopleMap = useMemo(() => {
    const map = new Map(salesOrgData.people.map((p) => [p.id, p]));
    return map;
  }, []);

  const teams = useMemo(() => Array.from(new Set(personnel.map((person) => person.team))), [personnel]);

  // Helper to get supervisor and direct report info for a person
  const getHierarchyInfo = (personId: string) => {
    const orgPerson = orgPeopleMap.get(personId);
    if (!orgPerson) return { supervisor: null, directReportCount: 0 };

    const supervisor = orgPerson.supervisorId ? orgPeopleMap.get(orgPerson.supervisorId) : null;
    const directReportCount = orgPerson.directReportIds?.length || 0;

    return {
      supervisor: supervisor ? supervisor.name : null,
      directReportCount,
    };
  };

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return personnel.filter((person) => {
      const matchesSearch =
        !normalized ||
        person.name.toLowerCase().includes(normalized) ||
        person.title.toLowerCase().includes(normalized);
      const matchesTeam = teamFilter === "all" || person.team === teamFilter;
      const matchesStatus = statusFilter === "all" || person.status === statusFilter;
      const matchesCapacity = person.capacity >= capacityMin && person.capacity <= capacityMax;
      return matchesSearch && matchesTeam && matchesStatus && matchesCapacity;
    });
  }, [capacityMax, capacityMin, personnel, search, statusFilter, teamFilter]);

  const selected = selectedId ? personnel.find((person) => person.id === selectedId) ?? null : null;

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const selectedParam = searchParams.get("select");
    if (selectedParam) {
      setSelectedId(selectedParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedId && !personnel.find((person) => person.id === selectedId)) {
      setSelectedId(personnel[0]?.id ?? null);
    }
  }, [personnel, selectedId]);

  useEffect(() => {
    if (selected) {
      addRecentEntity({
        id: selected.id,
        kind: "personnel",
        name: selected.name,
        subtitle: selected.title
      });
    }
  }, [addRecentEntity, selected]);

  const handleAdd = () => {
    const next = addPersonnel();
    setSelectedId(next.id);
  };

  const handleViewMap = (person: Personnel) => {
    router.push(`/map?focus=personnel:${person.id}`);
  };

  const renderMetric = (person: Personnel) => {
    if (person.metrics.sales) {
      return [
        { label: "Calls today", value: person.metrics.sales.callsToday },
        { label: "Sales week", value: person.metrics.sales.salesWeek },
        { label: "Revenue week", value: `$${person.metrics.sales.revenueWeek.toLocaleString()}` }
      ];
    }
    if (person.metrics.ops) {
      return [
        { label: "Jobs today", value: person.metrics.ops.jobsCompletedToday },
        { label: "Backlog", value: person.metrics.ops.backlog },
        { label: "Overtime hrs", value: person.metrics.ops.overtimeHoursWeek }
      ];
    }
    if (person.metrics.finance) {
      return [
        { label: "Invoices today", value: person.metrics.finance.invoicesProcessedToday },
        { label: "Close tasks", value: person.metrics.finance.closeTasksOpen },
        { label: "Days to close", value: person.metrics.finance.daysToCloseEstimate }
      ];
    }
    return [{ label: "Capacity", value: `${person.capacity}%` }];
  };

  return (
    <SectionLayout
      sidebar={
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Personnel</div>
            <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">Directory filters</div>
          </div>
          <Input
            ref={searchRef}
            label="Search"
            placeholder="Search by name or title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select label="Team" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
            <option value="all">All teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </Select>
          <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Capacity min"
              type="number"
              min={0}
              max={100}
              value={capacityMin}
              onChange={(event) => setCapacityMin(Number(event.target.value))}
            />
            <Input
              label="Capacity max"
              type="number"
              min={0}
              max={100}
              value={capacityMax}
              onChange={(event) => setCapacityMax(Number(event.target.value))}
            />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Teams</div>
            <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
              {teams.map((team) => (
                <button
                  key={team}
                  type="button"
                  className={teamFilter === team ? "text-[color:var(--text)]" : "hover:text-[color:var(--text)]"}
                  onClick={() => setTeamFilter(team)}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      detail={
        <div className="space-y-4">
          {selected ? (
            <PersonnelDetailPanel person={selected} showViewOnMap onViewMap={() => handleViewMap(selected)} />
          ) : (
            <Card className="flex items-center justify-center text-sm text-[color:var(--muted)]">
              Select a person to view details.
            </Card>
          )}
          <RecentEntities onSelect={(entity) => setSelectedId(entity.id)} />
        </div>
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Personnel"
          subtitle="Human operators running MAOS (Moneta Analytica Agent Team)."
          actions={<Button onClick={handleAdd}>Add new</Button>}
        />

        <Card className="p-0">
          <div className="border-b border-[color:var(--border)] px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Active personnel</div>
                <div className="text-lg font-semibold text-[color:var(--text)]">{filtered.length} profiles</div>
              </div>
              <Badge label="Operations directory" />
            </div>
          </div>
          <div className="divide-y divide-[color:var(--border)]">
            {filtered.map((person) => {
              const metrics = renderMetric(person);
              const hierarchyInfo = getHierarchyInfo(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setSelectedId(person.id)}
                  className={`w-full px-5 py-4 text-left transition hover:bg-[var(--hover)] ${
                    selectedId === person.id ? "bg-[var(--hover)]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Status light indicator */}
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-3 h-3 rounded-full ${statusLightColors[person.status]} ${
                            person.status === "Available" ? "animate-pulse shadow-lg shadow-green-500/50" : ""
                          }`}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--text)]">{person.name}</div>
                        <div className="text-xs text-[color:var(--muted)]">{person.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={person.team} />
                      <Badge label={person.status} />
                    </div>
                  </div>

                  {/* Hierarchy info row */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-[color:var(--muted)]">
                    {hierarchyInfo.supervisor && (
                      <div className="flex items-center gap-1">
                        <span className="text-[color:var(--muted)]">Reports to:</span>
                        <span className="text-[color:var(--text)] font-medium">{hierarchyInfo.supervisor}</span>
                      </div>
                    )}
                    {hierarchyInfo.directReportCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="text-[color:var(--text)] font-medium">
                          {hierarchyInfo.directReportCount} {hierarchyInfo.directReportCount === 1 ? "report" : "reports"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[color:var(--muted)] md:grid-cols-4">
                    {metrics.map((item) => (
                      <div key={item.label}>
                        <div className="text-[color:var(--muted)]">{item.label}</div>
                        <div className="text-sm text-[color:var(--text)]">{item.value}</div>
                      </div>
                    ))}
                    <div className="flex items-center justify-end md:justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleViewMap(person);
                        }}
                      >
                        View on map
                      </Button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </SectionLayout>
  );
}

export default function PersonnelPage() {
  return (
    <Suspense fallback={<div className="text-[color:var(--muted)]">Loading personnel…</div>}>
      <PersonnelContent />
    </Suspense>
  );
}
