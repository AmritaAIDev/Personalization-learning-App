"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatMonth,
  isMonthInRange,
  monthName,
  parseMonth,
  toMonth,
} from "@/lib/month";

/**
 * A month grid (12 buttons plus year arrows). The native `<input type="month">`
 * is not supported on iOS Safari, so this works everywhere. Months outside
 * `min`..`max` are shown but disabled, so the range is visible, not hidden.
 */
export default function MonthPicker({
  value,
  onChange,
  min,
  max,
  label = "Target month",
}: {
  value: string | null;
  onChange: (month: string) => void;
  /** Earliest selectable month, `YYYY-MM`. */
  min: string;
  /** Latest selectable month, `YYYY-MM`. */
  max: string;
  label?: string;
}) {
  const minYear = parseMonth(min).year;
  const maxYear = parseMonth(max).year;
  const startYear = Math.min(
    Math.max(value ? parseMonth(value).year : minYear, minYear),
    maxYear,
  );
  const [year, setYear] = useState(startYear);

  return (
    <div role="group" aria-label={label} className="w-full">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setYear((current) => current - 1)}
          disabled={year <= minYear}
          aria-label="Previous year"
          className="grid h-11 w-11 place-items-center rounded-xl border border-hairline text-ink-soft transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p
          className="font-heading text-lg font-bold text-ink"
          aria-live="polite"
        >
          {year}
        </p>
        <button
          type="button"
          onClick={() => setYear((current) => current + 1)}
          disabled={year >= maxYear}
          aria-label="Next year"
          className="grid h-11 w-11 place-items-center rounded-xl border border-hairline text-ink-soft transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 12 }, (_, index) => {
          const month = toMonth(year, index + 1);
          const selected = value === month;
          const allowed = isMonthInRange(month, min, max);
          return (
            <button
              key={month}
              type="button"
              disabled={!allowed}
              aria-pressed={selected}
              aria-label={formatMonth(month)}
              onClick={() => onChange(month)}
              className={`min-h-11 rounded-xl border px-2 text-sm font-semibold transition motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-35 ${
                selected
                  ? "border-transparent bg-primary text-white shadow-[0_8px_20px_rgba(63,111,87,0.22)]"
                  : "border-hairline bg-surface text-ink-soft hover:border-primary/30 hover:text-primary"
              }`}
            >
              {monthName(index + 1).slice(0, 3)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
