"use client";

import type { PerformanceRow } from "@/lib/diagnostic-types";

const statusStyles = {
  strong: "bg-success-tint text-success",
  average: "bg-warning-tint text-warning",
  weak: "bg-danger-tint text-danger",
};

export default function PerformanceBars({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: PerformanceRow[];
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5 shadow-[0_8px_22px_rgba(20,20,30,0.04)] sm:p-6">
      <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>
      <div className="mt-6 space-y-5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-semibold text-ink">{row.label}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[row.status]}`}
              >
                {row.status} · {row.correct}/{row.total}
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-canvas"
              aria-label={`${row.label}: ${row.score}%`}
            >
              <div
                className={`h-full rounded-full ${row.status === "strong" ? "bg-success" : row.status === "average" ? "bg-warning" : "bg-danger"}`}
                style={{ width: `${row.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
