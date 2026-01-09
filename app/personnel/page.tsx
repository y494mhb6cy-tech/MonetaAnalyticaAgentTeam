"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonnelDetailPanel } from "../../components/MaosDetailPanel";
import { Badge, Button, Card, Input, PageHeader, Select } from "../../components/ui";
import { Personnel, PersonnelStatus } from "../../lib/maos-types";
import { useMaosStore } from "../../lib/maos-store";

const statusOptions: PersonnelStatus[] = ["Available", "On Call", "Offline"];

export default function PersonnelPage() {
  const router = useRouter();
  const { personnel, addPersonnel } = useMaosStore();
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityMin, setCapacityMin] = useState(0);
  const [capacityMax, setCapacityMax] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(personnel[0]?.id ?? null);

  const teams = useMemo(() => Array.from(new Set(personnel.map((person) => person.team))), [personnel]);

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

  const handleAdd = () => {
    const next = addPersonnel();
    setSelectedId(next.id);
  };

  const handleViewMap = (person: Personnel) => {
    router.push(`/map?focus=personnel:${person.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnel"
        subtitle="Human operators running Moneta Analytica OS."
        actions={
          <Button onClick={handleAdd}>Add new</Button>
        }
      />

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <Input label="Search" placeholder="Search by name or title" value={search} onChange={(event) => setSearch(event.target.value)} />
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
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-0">
          <div className="border-b border-white/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Active Personnel</div>
                <div className="text-lg font-semibold text-white">{filtered.length} profiles</div>
              </div>
              <Badge label="Operations directory" />
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setSelectedId(person.id)}
                className={`w-full px-6 py-4 text-left transition hover:bg-white/5 ${
                  selectedId === person.id ? "bg-white/5" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-white">{person.name}</div>
                    <div className="text-sm text-slate-300">{person.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={person.team} />
                    <Badge label={person.status} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-slate-400 md:grid-cols-4">
                  <div>
                    <div className="text-slate-500">Calls (today)</div>
                    <div className="text-sm text-white">{person.metrics.callsToday}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Calls (week)</div>
                    <div className="text-sm text-white">{person.metrics.callsWeek}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Sales (week)</div>
                    <div className="text-sm text-white">{person.metrics.salesWeek}</div>
                  </div>
                  <div className="flex items-center justify-end md:justify-start">
                    <Button
                      variant="ghost"
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
            ))}
          </div>
        </Card>

        {selected ? (
          <div className="lg:sticky lg:top-24">
            <PersonnelDetailPanel person={selected} showViewOnMap onViewMap={() => handleViewMap(selected)} />
          </div>
        ) : (
          <Card className="flex items-center justify-center text-sm text-slate-400">
            Select a person to view details.
          </Card>
        )}
      </div>
    </div>
  );
}
