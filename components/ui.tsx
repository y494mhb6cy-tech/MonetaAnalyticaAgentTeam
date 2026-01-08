import clsx from "clsx";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle ? <p className="text-slate-400 mt-2 max-w-2xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("bg-ink-800 rounded-2xl p-6 shadow-card border border-white/5", className)}>
      {children}
    </div>
  );
}

export function Badge({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-slate-200">{label}</span>
  );
}

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label ? <span className="text-slate-300">{label}</span> : null}
      <input
        className="bg-ink-700 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
        {...props}
      />
    </label>
  );
}

export function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label ? <span className="text-slate-300">{label}</span> : null}
      <textarea
        className="bg-ink-700 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[140px] focus:outline-none focus:ring-2 focus:ring-accent-500"
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label ? <span className="text-slate-300">{label}</span> : null}
      <select
        className="bg-ink-700 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Button({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return (
    <button
      className={clsx(
        "px-4 py-2 rounded-lg text-sm font-medium transition",
        variant === "primary" && "bg-accent-500 text-ink-900 hover:bg-accent-500/90",
        variant === "ghost" && "bg-white/5 text-white hover:bg-white/10"
      )}
      {...props}
    >
      {children}
    </button>
  );
}
