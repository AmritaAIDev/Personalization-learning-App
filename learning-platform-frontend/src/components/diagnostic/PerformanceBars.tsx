'use client';

import type { PerformanceRow } from '@/lib/diagnostic-types';

const statusStyles = {
  strong: 'bg-emerald-100 text-emerald-800',
  average: 'bg-amber-100 text-amber-800',
  weak: 'bg-rose-100 text-rose-800',
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
    <section className="rounded-2xl border border-[#ececf0] bg-white p-5 shadow-[0_8px_22px_rgba(20, 20, 30,0.04)] sm:p-6">
      <h2 className="font-heading text-lg font-bold text-[#1a1a1f]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#52525b]">{description}</p>
      <div className="mt-6 space-y-5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-semibold text-[#1a1a1f]">{row.label}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[row.status]}`}>{row.status} · {row.correct}/{row.total}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#edf0f1]" aria-label={`${row.label}: ${row.score}%`}>
              <div className={`h-full rounded-full ${row.status === 'strong' ? 'bg-emerald-500' : row.status === 'average' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${row.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
