"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CircleAlert, Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { daysUntil, formatMonth, lastDayOfMonth, todayIST } from "@/lib/month";
import { requestProfileSetup } from "@/lib/personalization";
import {
  daysLeftLabel,
  generatePlanRequest,
  paceNote,
} from "@/lib/study-plan";
import { useMonthPlan } from "@/lib/useStudyPlan";

/**
 * The student's target: month, days left, how much of the whole plan is done
 * and whether they are on track, plus the way into the study plan. Every state
 * has a clear next step (no target yet, no plan yet, plan out of date).
 */
export default function TargetCard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useMonthPlan();
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  const profileMonth = user?.personalization.targetMonth ?? null;
  const targetMonth = data?.plan?.targetMonth ?? profileMonth;
  const daysLeft =
    data?.daysRemaining ??
    (targetMonth
      ? Math.max(0, daysUntil(todayIST(), lastDayOfMonth(targetMonth)))
      : null);

  const build = async () => {
    setBuildError(null);
    setBuilding(true);
    try {
      await generatePlanRequest();
    } catch (reason) {
      setBuildError(
        reason instanceof Error
          ? reason.message
          : "Your plan could not be built. Please try again.",
      );
    } finally {
      setBuilding(false);
    }
  };

  const plan = data?.plan ?? null;
  const note = plan ? paceNote(plan) : null;

  return (
    <section
      aria-labelledby="target-heading"
      className="min-w-0 rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_10px_28px_rgba(20,20,30,0.04)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            Target
          </p>
          <h2
            id="target-heading"
            className="mt-1 font-heading text-xl font-bold tracking-tight text-ink"
          >
            {targetMonth ? formatMonth(targetMonth) : "Set your target month"}
          </h2>
        </div>
        <Flag className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
      </div>

      {loading ? (
        <div className="mt-5 space-y-3" role="status" aria-label="Loading your target">
          <div className="h-5 w-1/2 rounded skeleton" />
          <div className="h-12 rounded-xl skeleton" />
        </div>
      ) : null}

      {error && !data ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger-tint px-4 py-3 text-sm text-danger" role="alert">
          <span className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex min-h-9 items-center rounded-full bg-danger px-4 text-xs font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && !targetMonth ? (
        <>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Choose the month you want to be ready by. We use it to plan your
            study schedule.
          </p>
          <button
            type="button"
            onClick={requestProfileSetup}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
          >
            Set my target
          </button>
        </>
      ) : null}

      {!loading && data && targetMonth && !data.hasPlan ? (
        <>
          <p className="mt-3 text-sm text-ink-soft">
            {daysLeftLabel(daysLeft)}. Build your plan to see what to study each day.
          </p>
          {buildError ? (
            <p className="mt-2 text-xs font-medium text-danger" role="alert">
              {buildError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void build()}
            disabled={building}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
          >
            {building ? "Building..." : "Build my plan"}
          </button>
        </>
      ) : null}

      {data?.hasPlan && plan ? (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="min-w-0 rounded-xl bg-canvas px-2 py-3">
              <dt className="truncate text-[11px] font-medium text-ink-mute">
                Days left
              </dt>
              <dd className="mt-0.5 font-heading text-xl font-bold text-ink">
                {daysLeft ?? "-"}
              </dd>
            </div>
            <div className="min-w-0 rounded-xl bg-canvas px-2 py-3">
              <dt className="truncate text-[11px] font-medium text-ink-mute">
                Plan done
              </dt>
              <dd className="mt-0.5 font-heading text-xl font-bold text-ink">
                {data.planTotals.percent}%
              </dd>
            </div>
            <div className="min-w-0 rounded-xl bg-canvas px-2 py-3">
              <dt className="truncate text-[11px] font-medium text-ink-mute">
                On track
              </dt>
              <dd className="mt-0.5 font-heading text-xl font-bold text-ink">
                {data.onTrack.percent}%
              </dd>
            </div>
          </dl>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-canvas"
            role="progressbar"
            aria-label="Target completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={data.planTotals.percent}
          >
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${data.planTotals.percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-mute">
            {data.planTotals.completed} of {data.planTotals.total} planned topics
            done
            {data.onTrack.due > 0
              ? `; ${data.onTrack.completedDue} of ${data.onTrack.due} due so far`
              : ""}
            .
          </p>

          {plan.stale ? (
            <div className="mt-4 rounded-xl border border-warning/25 bg-warning-tint px-3 py-3 text-xs leading-5 text-warning" role="status">
              Your plan was built for different settings.
              <button
                type="button"
                onClick={() => void build()}
                disabled={building}
                className="ml-1 font-bold underline disabled:opacity-60"
              >
                {building ? "Rebuilding..." : "Rebuild it"}
              </button>
            </div>
          ) : null}
          {note ? (
            <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs leading-5 text-ink-soft">
              {note}
            </p>
          ) : null}
          {buildError ? (
            <p className="mt-2 text-xs font-medium text-danger" role="alert">
              {buildError}
            </p>
          ) : null}

          <Link
            href="/plan"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(63,111,87,0.22)] transition hover:bg-primary-strong sm:w-auto"
          >
            View My Study Plan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      ) : null}
    </section>
  );
}
