import React from "react";
import clsx from "clsx";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--text)]">{title}</h1>
        {subtitle ? <p className="text-sm text-[color:var(--muted)] mt-2 max-w-2xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-[color:var(--border)] bg-[var(--panel)] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[color:var(--border)] bg-[var(--panel2)] px-2 py-0.5 text-[11px] text-[color:var(--muted)]">
      {label}
    </span>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  ({ label, ...props }, ref) => (
    <label className="flex flex-col gap-2 text-sm">
      {label ? <span className="text-[color:var(--muted)]">{label}</span> : null}
      <input
        ref={ref}
        className="rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        {...props}
      />
    </label>
  )
);

Input.displayName = "Input";

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
>(({ label, ...props }, ref) => (
  <label className="flex flex-col gap-2 text-sm">
    {label ? <span className="text-[color:var(--muted)]">{label}</span> : null}
    <textarea
      ref={ref}
      className="min-h-[140px] rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
      {...props}
    />
  </label>
));

TextArea.displayName = "TextArea";

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label ? <span className="text-[color:var(--muted)]">{label}</span> : null}
      <select
        className="rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost"; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={clsx(
        "rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]",
        size === "sm" && "h-8 px-3",
        size === "md" && "h-9 px-4",
        size === "lg" && "h-11 px-5 text-base",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,rgba(124,196,255,0.95),rgba(111,233,255,0.85))] text-[#0b0f14] shadow-[0_10px_20px_-12px_rgba(124,196,255,0.8)] hover:opacity-90",
        variant === "ghost" && "border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] hover:bg-[var(--hover)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
