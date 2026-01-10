"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Cpu,
  AlertTriangle,
  ArrowRight,
  Activity,
  Clock,
  DollarSign,
  FileStack,
  Zap,
  Shield,
  ChevronRight,
  CircleDot,
} from "lucide-react";
import { salesOrgData, companyTasks } from "../../lib/sales-mock-data";
import {
  computeExecutiveSummary,
  computeTeamBreakdowns,
  computeRiskItems,
  formatNumber,
  formatPercent,
  getRiskColor,
  getCapacityColor,
  type TeamBreakdown,
  type RiskItem,
} from "../../lib/executive-metrics";
import { BuildVersion } from "../../components/BuildVersion";
import MaosIntro from "../../components/MaosIntro";

// Animated number component
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue}</>;
}

// Trend indicator
function TrendIndicator({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") {
    return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  }
  if (trend === "down") {
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  }
  return <Minus className="w-4 h-4 text-slate-500" />;
}

// Progress ring
function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  color,
  bgColor = "rgba(148, 163, 184, 0.15)",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

// Work distribution bar
function WorkDistributionBar({
  revenue,
  admin,
  support,
}: {
  revenue: number;
  admin: number;
  support: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
        <div
          className="bg-emerald-500 transition-all duration-1000"
          style={{ width: `${revenue}%` }}
        />
        <div
          className="bg-amber-500 transition-all duration-1000"
          style={{ width: `${admin}%` }}
        />
        <div
          className="bg-slate-500 transition-all duration-1000"
          style={{ width: `${support}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Revenue</span>
          <span className="text-slate-200 font-medium">{revenue}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-400">Admin</span>
          <span className="text-slate-200 font-medium">{admin}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-slate-400">Support</span>
          <span className="text-slate-200 font-medium">{support}%</span>
        </div>
      </div>
    </div>
  );
}

// Team card
function TeamCard({ team, rank }: { team: TeamBreakdown; rank: number }) {
  const riskBorderColor =
    team.riskLevel === "critical"
      ? "border-red-500/50"
      : team.riskLevel === "high"
      ? "border-orange-500/50"
      : "border-[color:var(--border)]";

  return (
    <Link
      href={`/map?team=${team.id}`}
      className={`block p-4 rounded-xl border ${riskBorderColor} bg-[var(--panel)] hover:bg-[var(--hover)] transition-all group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          <span className="font-medium text-sm text-slate-200">{team.name}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          #{rank}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="text-lg font-semibold text-white">{team.headcount}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">People</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-emerald-400">{team.activeCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Active</div>
        </div>
        <div>
          <div
            className="text-lg font-semibold"
            style={{ color: team.blockedCount > 0 ? "#ef4444" : "#22c55e" }}
          >
            {team.blockedCount}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Blocked</div>
        </div>
      </div>

      {/* Mini work distribution */}
      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800 mb-2">
        <div
          className="bg-emerald-500"
          style={{ width: `${team.revenueWorkPercent}%` }}
        />
        <div
          className="bg-amber-500"
          style={{ width: `${team.adminDragPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{team.revenueWorkPercent}% revenue</span>
        <span>{team.adminDragPercent}% admin</span>
      </div>

      <div className="mt-3 pt-3 border-t border-[color:var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                team.flowHealth === "green"
                  ? "#22c55e"
                  : team.flowHealth === "amber"
                  ? "#eab308"
                  : "#ef4444",
            }}
          />
          <span className="text-xs text-slate-400 capitalize">{team.flowHealth} flow</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </Link>
  );
}

// Risk alert
function RiskAlert({ risk }: { risk: RiskItem }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border bg-[var(--panel)]"
      style={{ borderColor: `${getRiskColor(risk.severity)}40` }}
    >
      <div
        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
        style={{ backgroundColor: getRiskColor(risk.severity) }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200">{risk.title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{risk.description}</div>
      </div>
      <button
        disabled
        title="Coming soon"
        className="text-xs text-slate-500 flex-shrink-0 cursor-not-allowed opacity-60"
      >
        {risk.actionLabel}
      </button>
    </div>
  );
}

// Main page
export default function ExecutiveHomePage() {
  // First-time intro state
  const [showIntro, setShowIntro] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check for first visit on client side only
  useEffect(() => {
    setIsClient(true);
    const hasSeenIntro = localStorage.getItem("maos_intro_seen");
    if (!hasSeenIntro) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    localStorage.setItem("maos_intro_seen", "true");
    setShowIntro(false);
  }, []);

  // Compute metrics
  const summary = useMemo(
    () => computeExecutiveSummary(salesOrgData, companyTasks),
    []
  );

  const teamBreakdowns = useMemo(
    () =>
      computeTeamBreakdowns(salesOrgData, companyTasks).sort(
        (a, b) => b.revenueWorkPercent - a.revenueWorkPercent
      ),
    []
  );

  const risks = useMemo(() => computeRiskItems(salesOrgData, companyTasks), []);

  // Current time for "as of" display
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    setCurrentTime(
      new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, []);

  // Show intro on first visit
  if (isClient && showIntro) {
    return <MaosIntro onComplete={handleIntroComplete} />;
  }

  const criticalRisks = risks.filter(r => r.severity === "critical" || r.severity === "high");

  return (
    <div className="min-h-screen bg-[var(--bg)] overflow-x-hidden overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                MAOS
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Organizational Operating System
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-500">Updated</div>
                <div className="text-sm text-slate-300">{currentTime}</div>
              </div>
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  backgroundColor:
                    summary.criticalPathRisk === "critical"
                      ? "#ef4444"
                      : summary.criticalPathRisk === "high"
                      ? "#f97316"
                      : "#22c55e",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Top metrics row - answers key questions in <10s */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Capacity gauge */}
          <div className="p-6 rounded-xl border border-[color:var(--border)] bg-[var(--panel)]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-slate-400">Org Capacity</div>
              <TrendIndicator trend={summary.capacityTrend} />
            </div>
            <div className="flex items-center justify-center mb-4 relative">
              <ProgressRing
                value={summary.capacityUtilization}
                color={getCapacityColor(summary.capacityUtilization)}
                size={100}
                strokeWidth={8}
              />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-white">
                  <AnimatedNumber value={summary.capacityUtilization} />%
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  allocated
                </span>
              </div>
            </div>
            <div className="text-center text-xs text-slate-500">
              {formatNumber(summary.availableCapacity)}h available
            </div>
          </div>

          {/* Work distribution */}
          <div className="p-6 rounded-xl border border-[color:var(--border)] bg-[var(--panel)]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-slate-400">Work Allocation</div>
              <TrendIndicator trend={summary.revenueTrend} />
            </div>
            <WorkDistributionBar
              revenue={summary.revenueWorkPercent}
              admin={summary.adminDragPercent}
              support={summary.supportPercent}
            />
            <div className="mt-4 text-center">
              <span className="text-2xl font-bold text-emerald-400">
                <AnimatedNumber value={summary.revenueWorkPercent} />%
              </span>
              <span className="text-sm text-slate-400 ml-1">revenue-producing</span>
            </div>
          </div>

          {/* People status */}
          <div className="p-6 rounded-xl border border-[color:var(--border)] bg-[var(--panel)]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-slate-400">People</div>
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-white">
                  <AnimatedNumber value={salesOrgData.people.length} />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Total
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-400">
                  <AnimatedNumber
                    value={
                      salesOrgData.people.filter(
                        (p) => p.presence === "active" || p.presence === "online"
                      ).length
                    }
                  />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Active
                </div>
              </div>
            </div>
            {summary.blockedCount > 0 && (
              <div className="mt-4 flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-sm">{summary.blockedCount} blocked</span>
              </div>
            )}
          </div>

          {/* Risk status */}
          <div
            className="p-6 rounded-xl border bg-[var(--panel)]"
            style={{
              borderColor:
                summary.criticalPathRisk === "critical"
                  ? "rgba(239, 68, 68, 0.5)"
                  : summary.criticalPathRisk === "high"
                  ? "rgba(249, 115, 22, 0.5)"
                  : "var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-slate-400">Risk Status</div>
              <Shield className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getRiskColor(summary.criticalPathRisk) }}
              />
              <span className="text-xl font-semibold text-white capitalize">
                {summary.criticalPathRisk}
              </span>
            </div>
            <div className="space-y-1 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>Blocked people</span>
                <span className="text-slate-200">{summary.blockedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Overloaded teams</span>
                <span className="text-slate-200">{summary.overloadedTeamsCount}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xl font-semibold text-white">
                {formatNumber(summary.revenueHours)}h
              </div>
              <div className="text-xs text-slate-500">Revenue work</div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xl font-semibold text-white">
                {formatNumber(summary.adminHours)}h
              </div>
              <div className="text-xs text-slate-500">Admin drag</div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-semibold text-white">
                {summary.agentCoverage}%
              </div>
              <div className="text-xs text-slate-500">Agent coverage</div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <FileStack className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xl font-semibold text-white">
                {companyTasks.length}
              </div>
              <div className="text-xs text-slate-500">Active tasks</div>
            </div>
          </div>
        </section>

        {/* Teams and Risks side by side */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Teams by Revenue Focus</h2>
              <Link
                href="/map"
                className="text-sm text-[color:var(--accent)] hover:underline flex items-center gap-1"
              >
                View org map
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamBreakdowns.slice(0, 4).map((team, idx) => (
                <TeamCard key={team.id} team={team} rank={idx + 1} />
              ))}
            </div>
          </div>

          {/* Risk alerts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Attention Required</h2>
              {criticalRisks.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  {criticalRisks.length} critical
                </span>
              )}
            </div>
            <div className="space-y-3">
              {risks.length === 0 ? (
                <div className="p-6 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 mx-auto mb-3 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-sm text-slate-300">All systems nominal</div>
                  <div className="text-xs text-slate-500 mt-1">
                    No critical risks detected
                  </div>
                </div>
              ) : (
                risks.slice(0, 5).map((risk) => <RiskAlert key={risk.id} risk={risk} />)
              )}
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/map"
              className="p-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] hover:bg-[var(--hover)] transition-all group"
            >
              <Activity className="w-5 h-5 text-slate-400 mb-3 group-hover:text-[color:var(--accent)] transition-colors" />
              <div className="text-sm font-medium text-white">Org Map</div>
              <div className="text-xs text-slate-500">Visual overview</div>
            </Link>
            <Link
              href="/company-tasks"
              className="p-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] hover:bg-[var(--hover)] transition-all group"
            >
              <FileStack className="w-5 h-5 text-slate-400 mb-3 group-hover:text-[color:var(--accent)] transition-colors" />
              <div className="text-sm font-medium text-white">Task Queue</div>
              <div className="text-xs text-slate-500">All active work</div>
            </Link>
            <Link
              href="/agents"
              className="p-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] hover:bg-[var(--hover)] transition-all group"
            >
              <Cpu className="w-5 h-5 text-slate-400 mb-3 group-hover:text-[color:var(--accent)] transition-colors" />
              <div className="text-sm font-medium text-white">Agents</div>
              <div className="text-xs text-slate-500">AI operations</div>
            </Link>
            <Link
              href="/personnel"
              className="p-4 rounded-xl border border-[color:var(--border)] bg-[var(--panel)] hover:bg-[var(--hover)] transition-all group"
            >
              <Users className="w-5 h-5 text-slate-400 mb-3 group-hover:text-[color:var(--accent)] transition-colors" />
              <div className="text-sm font-medium text-white">Personnel</div>
              <div className="text-xs text-slate-500">Team directory</div>
            </Link>
          </div>
        </section>

        {/* Agent status row */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Agent Fleet Status</h2>
            <Link
              href="/agents"
              className="text-sm text-[color:var(--accent)] hover:underline flex items-center gap-1"
            >
              View all agents
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-6 rounded-xl border border-[color:var(--border)] bg-[var(--panel)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">16</div>
                <div className="text-xs text-slate-500 mt-1">Active Agents</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">94%</div>
                <div className="text-xs text-slate-500 mt-1">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">847</div>
                <div className="text-xs text-slate-500 mt-1">Runs Today</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400">68%</div>
                <div className="text-xs text-slate-500 mt-1">Avg Utilization</div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CircleDot className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-400">12 Running</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleDot className="w-3 h-3 text-slate-500" />
                <span className="text-slate-400">3 Idle</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleDot className="w-3 h-3 text-amber-400" />
                <span className="text-slate-400">1 Paused</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BuildVersion />
    </div>
  );
}
