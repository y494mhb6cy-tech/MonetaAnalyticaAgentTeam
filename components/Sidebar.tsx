"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/map", label: "Map", icon: "🗺️" },
  { href: "/personnel", label: "Personnel", icon: "👥" },
  { href: "/agents", label: "Agents", icon: "🤖" },
  { href: "/builder/tasks", label: "Builder", icon: "🧩" },
  { href: "/settings", label: "Settings", icon: "⚙️" }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-20 flex-col items-center border-r border-[var(--border)] bg-[var(--panel)] py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-xs font-semibold text-[var(--bg)]">
        MA
      </div>
      <nav className="mt-6 flex flex-1 flex-col items-center gap-3">
        {items.map((item) => {
          const active = item.href === "/builder/tasks"
            ? pathname.startsWith("/builder")
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px]",
                active
                  ? "bg-[var(--selection)] text-[var(--text)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">OS</div>
    </aside>
  );
}
