"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { formatDay } from "@/lib/month";
import { formatDailyMinutes } from "@/lib/personalization";
import { progressHeadline } from "@/lib/study-plan";
import type { TodayView } from "@/lib/study-plan-types";
import { usePlanTaskActions } from "@/lib/usePlanTaskActions";
import { PercentBar } from "./PlanBits";
import PlanTaskRow from "./PlanTaskRow";

/** Today's tasks, with anything left over from earlier days listed first. */
export default function DayPlanView({ view }: { view: TodayView }) {
  const { pending, error, run } = usePlanTaskActions();
  const { totals } = view;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
          {formatDay(view.date)}
        </p>
        <p className="mt-1 font-heading text-lg font-bold text-ink" aria-live="polite">
          {totals.total === 0
            ? "No tasks planned for today"
            : progressHeadline(totals)}
        </p>
        <div className="mt-2">
          <PercentBar label="Today's tasks completed" percent={totals.percent} />
        </div>
        {totals.total > 0 ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-mute">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDailyMinutes(totals.completedMinutes)} done of{" "}
            {formatDailyMinutes(totals.estMinutes)} planned
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {view.overdue.length > 0 ? (
        <section aria-label="Overdue tasks">
          <h3 className="text-sm font-bold text-warning">
            Overdue ({view.overdue.length})
          </h3>
          <ul className="mt-2 space-y-2">
            {view.overdue.map((task) => (
              <PlanTaskRow
                key={task.id}
                task={task}
                pending={pending.has(task.id)}
                onAction={run}
                showDate
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Today's tasks">
        {view.tasks.length === 0 ? (
          <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-ink-soft">
            Nothing is scheduled for today. Check the Week tab for what is next,
            or pick a topic from the{" "}
            <Link href="/subjects" className="font-semibold text-primary hover:underline">
              syllabus
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {view.tasks.map((task) => (
              <PlanTaskRow
                key={task.id}
                task={task}
                pending={pending.has(task.id)}
                onAction={run}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
