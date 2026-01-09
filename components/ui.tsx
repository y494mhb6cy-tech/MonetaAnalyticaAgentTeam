import clsx from "clsx";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-card", className)}>
      {children}
    </div>
  );
}

export function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={clsx("rounded-full bg-[var(--hover)] px-2 py-1 text-xs text-[var(--text)]", className)}>
      {label}
    </span>
  );
}

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
      {label ? <span>{label}</span> : null}
      <input
        className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
        {...props}
      />
    </label>
  );
}

export function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
      {label ? <span>{label}</span> : null}
      <textarea
        className="min-h-[140px] rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
      {label ? <span>{label}</span> : null}
      <select
        className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
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
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  return (
    <button
      className={clsx(
        "rounded-md px-3 py-2 text-sm font-medium transition",
        variant === "primary" && "bg-[var(--accent)] text-[var(--bg)] hover:opacity-90",
        variant === "ghost" && "text-[var(--text)] hover:bg-[var(--hover)]",
        variant === "outline" && "border border-[var(--border)] text-[var(--text)] hover:bg-[var(--hover)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
