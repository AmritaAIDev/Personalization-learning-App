"use client";

import { useState } from "react";
import Breadcrumb from "@/components/catalog/Breadcrumb";
import Tabs, { type TabDef } from "@/components/catalog/Tabs";
import DayPlanView from "@/components/plan/DayPlanView";
import MonthPlanView from "@/components/plan/MonthPlanView";
import { PanelError } from "@/components/plan/PlanBits";
import PlanEmptyState from "@/components/plan/PlanEmptyState";
import WeekPlanView from "@/components/plan/WeekPlanView";
import { useAuth } from "@/context/AuthContext";
import { daysUntil, formatMonth, lastDayOfMonth, todayIST } from "@/lib/month";
import { daysLeftLabel, generatePlanRequest, paceNote } from "@/lib/study-plan";
import { useTodayPlan } from "@/lib/useStudyPlan";

type PlanTab = "month" | "week" | "day";

const TABS: readonly TabDef<PlanTab>[] = [
  { id: "day", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export default function PlanPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useTodayPlan();
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildError, setRebuildError] = useState<string | null>(null);

  const plan = data?.plan ?? null;
  const targetMonth = plan?.targetMonth ?? user?.personalization.targetMonth ?? null;
  const daysLeft = targetMonth
    ? Math.max(0, daysUntil(todayIST(), lastDayOfMonth(targetMonth)))
    : null;
  const note = plan ? paceNote(plan) : null;

  const rebuild = async () => {
    setRebuildError(null);
    setRebuilding(true);
    try {
      await generatePlanRequest();
    } catch (reason) {
      setRebuildError(
        reason instanceof Error ? reason.message : "Your plan could not be rebuilt.",
      );
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas pb-20 premium-mesh">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <Breadcrumb
          items={[{ label: "Dashboard", href: "/" }, { label: "Study Plan" }]}
        />
        <header className="animate-rise mt-4">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
            Study Plan
          </p>
          <h1 className="mt-2 font-heading page-title text-ink">
            {targetMonth ? `Ready by ${formatMonth(targetMonth)}` : "Your study plan"}
          </h1>
          {data?.hasPlan ? (
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
              {daysLeftLabel(daysLeft)}. Tick topics off as you study, skip what you
              want to leave, and use Start Learning to open a topic.
            </p>
          ) : null}
        </header>

        {loading && !data ? (
          <div className="mt-8 h-72 rounded-2xl skeleton" role="status" aria-label="Loading your plan" />
        ) : null}

        {error && !data ? (
          <div className="mt-8">
            <PanelError message={error} onRetry={() => void reload()} />
          </div>
        ) : null}

        {data && !data.hasPlan ? (
          <div className="mt-8">
            <PlanEmptyState hasTarget={Boolean(user?.personalization.targetMonth)} />
          </div>
        ) : null}

        {data?.hasPlan && plan ? (
          <div className="mt-6 space-y-4">
            {plan.stale ? (
              <div
                className="rounded-xl border border-warning/25 bg-warning-tint px-4 py-3 text-sm text-warning"
                role="status"
              >
                Your plan was built for different settings.
                <button
                  type="button"
                  onClick={() => void rebuild()}
                  disabled={rebuilding}
                  className="ml-1 font-bold underline disabled:opacity-60"
                >
                  {rebuilding ? "Rebuilding..." : "Rebuild it"}
                </button>
              </div>
            ) : null}
            {note ? (
              <p className="rounded-xl bg-surface px-4 py-3 text-sm text-ink-soft ring-1 ring-hairline">
                {note}
              </p>
            ) : null}
            {rebuildError ? (
              <p className="text-sm font-medium text-danger" role="alert">
                {rebuildError}
              </p>
            ) : null}

            <Tabs
              tabs={TABS}
              label="Study plan views"
              idPrefix="plan"
              render={(active) =>
                active === "day" ? (
                  <DayPlanView view={data} />
                ) : active === "week" ? (
                  <WeekPlanView />
                ) : (
                  <MonthPlanView targetMonth={plan.targetMonth} />
                )
              }
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
