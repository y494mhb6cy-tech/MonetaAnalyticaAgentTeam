"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/run", label: "Run" },
  { href: "/builder/tasks", label: "Builder" },
  { href: "/artifacts", label: "Artifacts" },
  { href: "/settings", label: "Settings" }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-ink-800 border-r border-white/5 p-6 flex flex-col gap-8">
      <div>
        <div className="text-xl font-semibold tracking-wide">Moneta Analytica</div>
        <div className="text-xs text-slate-400 mt-1">Task Rabbits</div>
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
              className={clsx(
                "px-3 py-2 rounded-lg text-sm",
                active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto text-xs text-slate-500">
        Profit · Process · Objectivity
      </div>
    </aside>
  );
}
