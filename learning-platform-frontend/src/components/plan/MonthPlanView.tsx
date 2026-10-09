"use client";

import { useState } from "react";
import { addMonths, currentMonthIST, formatMonth } from "@/lib/month";
import { formatDailyMinutes } from "@/lib/personalization";
import { getSubjectTheme } from "@/lib/subject-theme";
import { useMonthPlan } from "@/lib/useStudyPlan";
import { PanelError, PanelLoading, PercentBar, Stepper, StatTile } from "./PlanBits";

function percentOf(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/** One month at a time: planned versus completed, per subject and per chapter. */
export default function MonthPlanView({ targetMonth }: { targetMonth: string }) {
  const now = currentMonthIST();
  const [month, setMonth] = useState(() => (now <= targetMonth ? now : targetMonth));
  const { data, loading, error, reload } = useMonthPlan(month);

  return (
    <div className="space-y-5">
      <Stepper
        subject="month"
        label={formatMonth(month)}
        onPrev={() => setMonth((current) => addMonths(current, -1))}
        onNext={() => setMonth((current) => addMonths(current, 1))}
        prevDisabled={month <= now}
        nextDisabled={month >= targetMonth}
      />

      {loading && !data ? <PanelLoading label="Loading this month" /> : null}
      {error && !data ? (
        <PanelError message={error} onRetry={() => void reload()} />
      ) : null}

      {data ? (
        <>
          <div>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <StatTile label="Month done" value={`${data.totals.percent}%`} />
              <StatTile
                label="Planned vs done"
                value={`${data.totals.completed}/${data.totals.total}`}
              />
              <StatTile
                label="Planned time"
                value={formatDailyMinutes(data.totals.estMinutes)}
              />
            </dl>
            <div className="mt-3">
              <PercentBar label="Month completed" percent={data.totals.percent} />
            </div>
          </div>

          {data.subjects.length === 0 ? (
            <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-ink-soft">
              No topics are planned in {formatMonth(month)}.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-3">
              {data.subjects.map((subject) => {
                const theme = getSubjectTheme(subject.subject);
                return (
                  <li
                    key={subject.subject}
                    className="min-w-0 rounded-xl border border-hairline bg-surface p-4"
                  >
                    <p className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-bold text-ink">
                        {subject.subject}
                      </span>
                      <span className="shrink-0 text-xs text-ink-mute">
                        {subject.completed}/{subject.planned} topics
                      </span>
                    </p>
                    <div className="mt-2">
                      <PercentBar
                        label={`${subject.subject} this month`}
                        percent={percentOf(subject.completed, subject.planned)}
                        barClass={theme.accent}
                      />
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {subject.chapters.map((chapter) => (
                        <li
                          key={chapter.chapter}
                          className="flex items-baseline justify-between gap-3 text-xs"
                        >
                          <span className="min-w-0 truncate text-ink-soft">
                            {chapter.chapter}
                          </span>
                          <span className="shrink-0 font-semibold text-ink-mute">
                            {chapter.completed}/{chapter.planned}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-xs text-ink-mute">
            Whole plan: {data.planTotals.completed} of {data.planTotals.total} topics
            done ({data.planTotals.percent}%).
          </p>
        </>
      ) : null}
    </div>
  );
}
