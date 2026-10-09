"use client";

import { useCallback, useEffect } from "react";
import { apiFetch } from "./api";
import { PLAN_UPDATED_EVENT } from "./study-plan";
import type { MonthView, TodayView, WeekView } from "./study-plan-types";
import { useApiResource } from "./useApiResource";

/** Reloads in the background whenever the plan changes anywhere on the page. */
function useRefreshOnPlanChange(reload: () => Promise<void>) {
  useEffect(() => {
    const refresh = () => void reload();
    window.addEventListener(PLAN_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PLAN_UPDATED_EVENT, refresh);
  }, [reload]);
}

export function useTodayPlan() {
  const fetcher = useCallback(
    () => apiFetch<TodayView>("/api/study-plan/today"),
    [],
  );
  const resource = useApiResource(fetcher, "Today's plan could not be loaded.");
  useRefreshOnPlanChange(resource.reload);
  return resource;
}

/** `date` is any day of the wanted week (YYYY-MM-DD); omit for this week. */
export function useWeekPlan(date?: string) {
  const fetcher = useCallback(
    () =>
      apiFetch<WeekView>(
        `/api/study-plan/week${date ? `?d=${encodeURIComponent(date)}` : ""}`,
      ),
    [date],
  );
  const resource = useApiResource(fetcher, "This week's plan could not be loaded.");
  useRefreshOnPlanChange(resource.reload);
  return resource;
}

/** `month` is YYYY-MM; omit for the plan's target month. */
export function useMonthPlan(month?: string) {
  const fetcher = useCallback(
    () =>
      apiFetch<MonthView>(
        `/api/study-plan/month${month ? `?m=${encodeURIComponent(month)}` : ""}`,
      ),
    [month],
  );
  const resource = useApiResource(fetcher, "Your monthly plan could not be loaded.");
  useRefreshOnPlanChange(resource.reload);
  return resource;
}
