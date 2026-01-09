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

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label ? <span className="text-[color:var(--muted)]">{label}</span> : null}
      <input
        className="rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        {...props}
      />
    </label>
  );
}

export function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label ? <span className="text-[color:var(--muted)]">{label}</span> : null}
      <textarea
        className="min-h-[140px] rounded-lg border border-[color:var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        {...props}
      />
    </label>
  );
}

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
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return (
    <button
      className={clsx(
        "rounded-lg px-3 py-2 text-sm font-medium transition",
        variant === "primary" && "bg-[color:var(--accent)] text-[#0b0f14] hover:opacity-90",
        variant === "ghost" && "border border-[color:var(--border)] bg-[var(--panel2)] text-[color:var(--text)] hover:bg-[var(--hover)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
