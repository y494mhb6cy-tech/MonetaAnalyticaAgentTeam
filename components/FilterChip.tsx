"use client";

import { X } from "lucide-react";
import React from "react";

interface FilterChipProps {
  label: string;
  onRemove?: () => void;
  active?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, onRemove, active = true, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition ${
        active
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] hover:bg-[var(--hover)]"
      }`}
    >
      <span>{label}</span>
      {onRemove && (
        <X
          className="h-3 w-3 cursor-pointer hover:opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{title}</div>
      {children}
    </div>
  );
}

interface FilterPresetButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
}

export function FilterPresetButton({ label, onClick, active = false }: FilterPresetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm transition ${
        active
          ? "bg-blue-600 text-white"
          : "border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] hover:bg-[var(--hover)]"
      }`}
    >
      {label}
    </button>
  );
}
