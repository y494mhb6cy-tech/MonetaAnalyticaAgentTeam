"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/map", label: "Map", icon: "🗺️" },
  { href: "/personnel", label: "Personnel", icon: "👥" },
  { href: "/agents", label: "Agents", icon: "🤖" },
  { href: "/tasks", label: "Tasks", icon: "🧭" },
  { href: "/builder/tasks", label: "Builder", icon: "🧩" },
  { href: "/settings", label: "Settings", icon: "⚙️" }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-[76px] flex-col items-center gap-6 border-r border-[color:var(--border)] bg-[var(--panel)] py-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--panel2)] text-lg font-semibold text-[color:var(--text)]">
        MA
      </div>
      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          const active = item.href === "/builder/tasks"
            ? pathname.startsWith("/builder")
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-xl text-base transition",
                active
                  ? "bg-[var(--selection)] text-[color:var(--text)]"
                  : "text-[color:var(--muted)] hover:bg-[var(--hover)] hover:text-[color:var(--text)]"
              )}
            >
              <span aria-hidden>{item.icon}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">MAOS</div>
    </aside>
  );
}
