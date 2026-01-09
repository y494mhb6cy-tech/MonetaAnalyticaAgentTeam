"use client";

import React from "react";
import type { OrgPerson, OrgDepartment, PersonnelPresence } from "../lib/maos-types";

interface MapDetailsDrawerProps {
  person: OrgPerson | null;
  department: OrgDepartment | null;
  onClose: () => void;
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

function getPresenceColor(presence: PersonnelPresence): string {
  switch (presence) {
    case "offline":
      return "text-slate-500";
    case "online":
      return "text-blue-400";
    case "active":
      return "text-green-400";
    case "blocked":
      return "text-red-400";
  }
}

function getPresenceBgColor(presence: PersonnelPresence): string {
  switch (presence) {
    case "offline":
      return "bg-slate-500/20";
    case "online":
      return "bg-blue-500/20";
    case "active":
      return "bg-green-500/20";
    case "blocked":
      return "bg-red-500/20";
  }
}

export default function MapDetailsDrawer({
  person,
  department,
  onClose,
}: MapDetailsDrawerProps) {
  const isOpen = person !== null || department !== null;

  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-0 right-0 h-full w-80 z-30 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full bg-slate-900/95 backdrop-blur-md border-l border-slate-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-white">
            {person ? "Person Details" : "Department Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {person && <PersonDetails person={person} />}
          {department && !person && <DepartmentDetails department={department} />}
        </div>
      </div>
    </div>
  );
}

function PersonDetails({ person }: { person: OrgPerson }) {
  return (
    <div className="space-y-4">
      {/* Avatar and name */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
          {person.avatarInitials}
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{person.name}</h3>
          <p className="text-sm text-slate-400">{person.role}</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPresenceBgColor(
            person.presence
          )} ${getPresenceColor(person.presence)}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              person.presence === "active"
                ? "animate-pulse bg-green-400"
                : person.presence === "blocked"
                ? "animate-pulse bg-red-400"
                : person.presence === "online"
                ? "bg-blue-400"
                : "bg-slate-500"
            }`}
          />
          {getPresenceLabel(person.presence)}
        </span>
        {person.leverageScore > 80 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            High-leverage
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="space-y-3 pt-2">
        <div className="text-xs uppercase tracking-wider text-slate-500">
          Performance
        </div>

        {/* Leverage score */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Leverage Score</span>
            <span className="text-white font-medium">{person.leverageScore}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                person.leverageScore > 80
                  ? "bg-amber-500"
                  : person.leverageScore > 50
                  ? "bg-green-500"
                  : "bg-slate-500"
              }`}
              style={{ width: `${person.leverageScore}%` }}
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Department</div>
          <div className="text-sm text-white">{person.departmentId}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-700/50 space-y-2">
        <button className="w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
          View Full Profile
        </button>
        <button className="w-full px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
          Assign Task
        </button>
      </div>
    </div>
  );
}

function DepartmentDetails({ department }: { department: OrgDepartment }) {
  const healthColor =
    department.flowHealth === "green"
      ? "text-green-400"
      : department.flowHealth === "amber"
      ? "text-amber-400"
      : "text-red-400";

  const healthBg =
    department.flowHealth === "green"
      ? "bg-green-500/20"
      : department.flowHealth === "amber"
      ? "bg-amber-500/20"
      : "bg-red-500/20";

  return (
    <div className="space-y-4">
      {/* Department header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: department.color + "30" }}
        >
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: department.color }}
          />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{department.name}</h3>
          <p className="text-sm text-slate-400">Department</p>
        </div>
      </div>

      {/* Flow health */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${healthBg} ${healthColor}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              department.flowHealth === "green"
                ? "bg-green-400"
                : department.flowHealth === "amber"
                ? "bg-amber-400"
                : "bg-red-400 animate-pulse"
            }`}
          />
          {department.flowHealth === "green"
            ? "Healthy"
            : department.flowHealth === "amber"
            ? "Warning"
            : "Critical"}
        </span>
      </div>

      {/* Metrics */}
      <div className="space-y-3 pt-2">
        <div className="text-xs uppercase tracking-wider text-slate-500">
          Metrics
        </div>

        {/* Efficiency */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Efficiency</span>
            <span className="text-white font-medium">{department.efficiency}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${department.efficiency}%` }}
            />
          </div>
        </div>

        {/* Active load */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Active Tasks</span>
            <span className="text-white font-medium">{department.activeLoad}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-700/50 space-y-2">
        <button className="w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
          View Department
        </button>
        <button className="w-full px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
          View All Personnel
        </button>
      </div>
    </div>
  );
}
