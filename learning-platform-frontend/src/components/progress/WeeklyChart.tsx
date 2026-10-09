"use client";

import { todayIST, weekdayShort } from "@/lib/month";
import type { StudyTaskView } from "@/lib/study-plan-types";

export interface DayBar {
  date: string;
  planned: number;
  completed: number;
}

/** One bar per day of the week: tasks completed out of tasks planned (skipped tasks are not owed). */
export function dayBars(
  days: ReadonlyArray<{ date: string; tasks: readonly StudyTaskView[] }>,
): DayBar[] {
  return days.map((day) => {
    const counted = day.tasks.filter((task) => task.status !== "SKIPPED");
    return {
      date: day.date,
      planned: counted.length,
      completed: counted.filter((task) => task.status === "COMPLETED").length,
    };
  });
}

/**
 * This week's planned versus completed tasks, day by day. The bars are
 * decorative; the same numbers are in the text under each one.
 */
export default function WeeklyChart({ bars }: { bars: readonly DayBar[] }) {
  const peak = Math.max(1, ...bars.map((bar) => bar.planned));
  const today = todayIST();

  return (
    <ol className="grid grid-cols-7 gap-1.5 sm:gap-3" aria-label="Tasks completed each day this week">
      {bars.map((bar) => {
        const plannedHeight = (bar.planned / peak) * 100;
        const doneHeight = bar.planned > 0 ? (bar.completed / peak) * 100 : 0;
        const isToday = bar.date === today;
        return (
          <li key={bar.date} className="min-w-0 text-center">
            <div className="flex h-24 items-end justify-center rounded-lg bg-canvas px-1 sm:h-28">
              <div
                className="relative w-full max-w-8 overflow-hidden rounded-t-md bg-primary/20"
                style={{ height: `${plannedHeight}%` }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-x-0 bottom-0 bg-primary transition-[height] duration-700 motion-reduce:transition-none"
                  style={{ height: `${plannedHeight > 0 ? (doneHeight / plannedHeight) * 100 : 0}%` }}
                />
              </div>
            </div>
            <p className={`mt-1.5 text-[11px] font-semibold ${isToday ? "text-primary" : "text-ink-mute"}`}>
              {weekdayShort(bar.date)}
            </p>
            <p className="text-[11px] text-ink-mute">
              {bar.completed}/{bar.planned}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
