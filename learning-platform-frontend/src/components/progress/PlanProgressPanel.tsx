"use client";

import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { PanelError, PanelLoading, PercentBar, StatTile } from "@/components/plan/PlanBits";
import { useAuth } from "@/context/AuthContext";
import { formatMonth } from "@/lib/month";
import { daysLeftLabel } from "@/lib/study-plan";
import { useMonthPlan, useWeekPlan } from "@/lib/useStudyPlan";
import WeeklyChart, { dayBars } from "./WeeklyChart";

/**
 * How the student is doing against their plan: whole-plan completion, whether
 * they are on track for the target month, the week so far and their streak.
 */
export default function PlanProgressPanel() {
  const { user } = useAuth();
  const month = useMonthPlan();
  const week = useWeekPlan();

  const plan = month.data?.plan ?? null;
  const loading = (month.loading && !month.data) || (week.loading && !week.data);
  const error = month.error && !month.data ? month.error : week.error && !week.data ? week.error : null;

  return (
    <section
      aria-labelledby="plan-progress-heading"
      className="min-w-0 rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_10px_28px_rgba(20,20,30,0.04)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            Study plan
          </p>
          <h2
            id="plan-progress-heading"
            className="mt-1 font-heading text-xl font-bold tracking-tight text-ink"
          >
            {plan ? `Progress towards ${formatMonth(plan.targetMonth)}` : "Plan progress"}
          </h2>
        </div>
        <Link
          href="/plan"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-hairline px-4 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
        >
          Open study plan
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {loading ? <div className="mt-5"><PanelLoading label="Loading plan progress" /></div> : null}
      {error ? (
        <div className="mt-5">
          <PanelError
            message={error}
            onRetry={() => {
              void month.reload();
              void week.reload();
            }}
          />
        </div>
      ) : null}

      {month.data && !month.data.hasPlan ? (
        <p className="mt-5 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-soft">
          You have no study plan yet.{" "}
          <Link href="/plan" className="font-semibold text-primary hover:underline">
            Build one
          </Link>{" "}
          to see planned versus completed work here.
        </p>
      ) : null}

      {month.data?.hasPlan && week.data ? (
        <div className="mt-5 space-y-5">
          <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <StatTile label="Plan completed" value={`${month.data.planTotals.percent}%`} />
            <StatTile label="On track" value={`${month.data.onTrack.percent}%`} />
            <StatTile label="Days left" value={daysLeftLabel(month.data.daysRemaining).replace(/ left$/, "") || "-"} />
            <StatTile
              label="Streak"
              value={
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-4 w-4 text-warning" aria-hidden="true" />
                  {user?.streak ?? 0}d
                </span>
              }
            />
          </dl>

          <div>
            <p className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">Planned vs completed</span>
              <span className="text-xs text-ink-mute">
                {month.data.planTotals.completed} of {month.data.planTotals.total} topics
              </span>
            </p>
            <div className="mt-2">
              <PercentBar
                label="Whole plan completed"
                percent={month.data.planTotals.percent}
                height="h-3"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">This week</h3>
            <div className="mt-3">
              <WeeklyChart bars={dayBars(week.data.days)} />
            </div>
            <p className="mt-2 text-xs text-ink-mute">
              {week.data.totals.completed} of {week.data.totals.total} tasks done this week (
              {week.data.totals.percent}%).
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
