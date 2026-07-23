'use client';

import type { PerformanceRow } from '@/lib/diagnostic-types';

function pointFor(index: number, count: number, distance: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return {
    x: 100 + Math.cos(angle) * distance,
    y: 100 + Math.sin(angle) * distance,
  };
}

function polygonPoints(rows: PerformanceRow[], multiplier: number) {
  return rows
    .map((row, index) => {
      const point = pointFor(index, rows.length, 64 * multiplier * (row.score / 100));
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

export default function BloomRadar({ rows }: { rows: PerformanceRow[] }) {
  if (rows.length < 3) return null;

  const outer = rows.map((_, index) => {
    const point = pointFor(index, rows.length, 64);
    return `${point.x},${point.y}`;
  }).join(' ');
  const middle = rows.map((_, index) => {
    const point = pointFor(index, rows.length, 32);
    return `${point.x},${point.y}`;
  }).join(' ');

  return (
    <section className="rounded-2xl border border-[#ececf0] bg-white p-5 shadow-[0_8px_22px_rgba(20, 20, 30,0.04)] sm:p-6">
      <h2 className="font-heading text-lg font-bold text-[#1a1a1f]">Cognitive skill profile</h2>
      <p className="mt-1 text-sm leading-6 text-[#52525b]">Skill balance across the attempt.</p>
      <div className="mx-auto mt-3 max-w-sm">
        <svg viewBox="0 0 200 200" role="img" aria-label="Radar chart of thinking skill performance">
          <polygon points={outer} fill="#fbfbfd" stroke="#e4e5e7" strokeWidth="1" />
          <polygon points={middle} fill="none" stroke="#e4e5e7" strokeWidth="1" strokeDasharray="3 3" />
          {rows.map((_, index) => {
            const point = pointFor(index, rows.length, 64);
            return <line key={index} x1="100" y1="100" x2={point.x} y2={point.y} stroke="#e4e5e7" strokeWidth="1" />;
          })}
          <polygon points={polygonPoints(rows, 1)} fill="rgba(63, 111, 87, 0.10)" stroke="#3f6f57" strokeWidth="1.5" strokeLinejoin="round" />
          {rows.map((row, index) => {
            const point = pointFor(index, rows.length, 64 * (row.score / 100));
            const label = pointFor(index, rows.length, 86);
            return (
              <g key={row.label}>
                <circle cx={point.x} cy={point.y} r="2.5" fill="#3f6f57" />
                <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" className="fill-[#52525b] text-[9px] font-semibold">{row.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {rows.map((row) => <div key={row.label} className="rounded-lg bg-[#f4f4f6] px-2.5 py-2"><dt className="truncate text-[#52525b]">{row.label}</dt><dd className="mt-1 font-bold text-[#1a1a1f]">{row.score}%</dd></div>)}
      </dl>
    </section>
  );
}
