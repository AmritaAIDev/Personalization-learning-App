"use client";

import { barTone, formatWeekLabel } from "@/lib/catalog";
import type { TrendPoint } from "@/lib/catalog-types";

/**
 * Weekly accuracy as bars (oldest left). Weeks with no answers show an empty
 * slot with a dash, not a 0% bar, so quiet weeks don't read as failures.
 */
export default function TrendChart({ points }: { points: readonly TrendPoint[] }) {
  const summary = points
    .map((point) =>
      point.accuracy === null
        ? `week of ${formatWeekLabel(point.weekStart)}: no answers`
        : `week of ${formatWeekLabel(point.weekStart)}: ${point.accuracy}% over ${point.answered} answers`,
    )
    .join("; ");

  return (
    <div role="img" aria-label={`Weekly accuracy. ${summary}`}>
      <div className="flex h-40 items-end gap-1.5 sm:gap-2" aria-hidden="true">
        {points.map((point) => (
          <div
            key={point.weekStart}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
          >
            <span className="mb-1 text-center text-[10px] font-bold text-ink-soft">
              {point.accuracy === null ? "—" : `${point.accuracy}%`}
            </span>
            <span
              className={`block w-full rounded-t-md transition-[height] duration-700 motion-reduce:transition-none ${barTone(point.accuracy)}`}
              style={{
                height: point.accuracy === null ? "4px" : `${Math.max(point.accuracy, 4)}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2" aria-hidden="true">
        {points.map((point) => (
          <span
            key={point.weekStart}
            className="min-w-0 flex-1 truncate text-center text-[10px] text-ink-mute"
          >
            {formatWeekLabel(point.weekStart)}
          </span>
        ))}
      </div>
    </div>
  );
}
