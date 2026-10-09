"use client";

import { useState } from "react";
import { addDays, formatDay, todayIST } from "@/lib/month";
import { formatDailyMinutes } from "@/lib/personalization";
import { getSubjectTheme } from "@/lib/subject-theme";
import { usePlanTaskActions } from "@/lib/usePlanTaskActions";
import { useWeekPlan } from "@/lib/useStudyPlan";
import { PanelError, PanelLoading, PercentBar, Stepper, StatTile } from "./PlanBits";
import PlanTaskRow from "./PlanTaskRow";

/** One week at a time: weekly completion, subject-wise time and each day's tasks. */
export default function WeekPlanView() {
  const [anchor, setAnchor] = useState(() => todayIST());
  const { data, loading, error, reload } = useWeekPlan(anchor);
  const { pending, error: actionError, run } = usePlanTaskActions();
  const today = todayIST();

  const label = data
    ? `${formatDay(data.weekStart)} to ${formatDay(data.weekEnd)}`
    : "This week";

  return (
    <div className="space-y-5">
      <Stepper
        subject="week"
        label={label}
        onPrev={() => setAnchor((current) => addDays(current, -7))}
        onNext={() => setAnchor((current) => addDays(current, 7))}
      />

      {loading && !data ? <PanelLoading label="Loading this week" /> : null}
      {error && !data ? (
        <PanelError message={error} onRetry={() => void reload()} />
      ) : null}

      {data ? (
        <>
          <div>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <StatTile label="Week done" value={`${data.totals.percent}%`} />
              <StatTile
                label="Tasks"
                value={`${data.totals.completed}/${data.totals.total}`}
              />
              <StatTile
                label="Planned time"
                value={formatDailyMinutes(data.totals.estMinutes)}
              />
            </dl>
            <div className="mt-3">
              <PercentBar label="Week completed" percent={data.totals.percent} />
            </div>
          </div>

          {data.subjects.length > 0 ? (
            <section aria-label="Subject-wise tasks">
              <h3 className="text-sm font-bold text-ink">Subject-wise</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-3">
                {data.subjects.map((subject) => {
                  const theme = getSubjectTheme(subject.subject);
                  const percent =
                    subject.tasks > 0
                      ? Math.round((subject.completed / subject.tasks) * 100)
                      : 0;
                  return (
                    <li
                      key={subject.subject}
                      className="min-w-0 rounded-xl border border-hairline bg-surface px-3 py-3"
                    >
                      <p className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate font-semibold text-ink">
                          {subject.subject}
                        </span>
                        <span className="shrink-0 text-xs text-ink-mute">
                          {subject.completed}/{subject.tasks}
                        </span>
                      </p>
                      <div className="mt-2">
                        <PercentBar
                          label={`${subject.subject} this week`}
                          percent={percent}
                          barClass={theme.accent}
                        />
                      </div>
                      <p className="mt-1 text-xs text-ink-mute">
                        {formatDailyMinutes(subject.estMinutes)} planned
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {actionError ? (
            <p className="text-xs font-medium text-danger" role="alert">
              {actionError}
            </p>
          ) : null}

          <ol className="space-y-4">
            {data.days.map((day) => {
              const done = day.tasks.filter((task) => task.status === "COMPLETED").length;
              const isToday = day.date === today;
              return (
                <li key={day.date}>
                  <h3 className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-bold text-ink">
                    <span>
                      {formatDay(day.date)}
                      {isToday ? (
                        <span className="ml-2 rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          Today
                        </span>
                      ) : null}
                    </span>
                    {day.tasks.length > 0 ? (
                      <span className="text-xs font-medium text-ink-mute">
                        {done}/{day.tasks.length} done
                      </span>
                    ) : null}
                  </h3>
                  {day.tasks.length === 0 ? (
                    <p className="mt-1 text-xs text-ink-mute">Nothing planned.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {day.tasks.map((task) => (
                        <PlanTaskRow
                          key={task.id}
                          task={task}
                          pending={pending.has(task.id)}
                          onAction={run}
                        />
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      ) : null}
    </div>
  );
}
