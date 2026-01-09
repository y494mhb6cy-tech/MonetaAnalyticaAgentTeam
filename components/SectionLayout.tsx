import React from "react";
import clsx from "clsx";

export function SectionLayout({
  sidebar,
  children,
  detail,
  className
}: {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  detail?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col lg:flex-row gap-0", className)}>
      {sidebar ? (
        <aside className="w-full border-b border-[color:var(--border)] bg-[var(--panel)] px-4 py-4 lg:w-72 lg:border-b-0 lg:border-r lg:px-5">
          {sidebar}
        </aside>
      ) : null}
      <main className="flex-1 min-w-0 bg-[var(--bg)]">
        <div className="px-5 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
      {detail ? (
        <aside className="w-full border-t border-[color:var(--border)] bg-[var(--panel)] px-4 py-4 lg:w-80 lg:border-l lg:border-t-0 lg:px-5">
          <div className="lg:sticky lg:top-6">{detail}</div>
        </aside>
      ) : null}
    </div>
  );
}
