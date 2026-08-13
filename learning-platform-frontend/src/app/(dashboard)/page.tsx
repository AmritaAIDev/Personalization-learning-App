"use client";

import { useCallback, useEffect } from "react";
import { CircleAlert } from "lucide-react";
import StudentActionCenter from "@/components/dashboard/StudentActionCenter";
import LearningOverview from "@/components/learning/LearningOverview";
import TopicSearch from "@/components/search/TopicSearch";
import { LEARNING_DATA_UPDATED_EVENT, apiFetch } from "@/lib/api";
import type { StudentDashboardPayload } from "@/lib/student-dashboard-types";
import { useApiResource } from "@/lib/useApiResource";

function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-7" aria-label="Loading dashboard">
      <div className="h-72 rounded-[1.75rem] skeleton" />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="h-44 rounded-2xl skeleton" />
        <div className="h-44 rounded-2xl skeleton" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const fetchDashboard = useCallback(
    () => apiFetch<StudentDashboardPayload>("/api/dashboard/student"),
    [],
  );
  const { data, loading, error, reload: loadDashboard } = useApiResource(
    fetchDashboard,
    "Your learning dashboard could not be loaded.",
  );

  useEffect(() => {
    const refreshDashboard = () => void loadDashboard();
    window.addEventListener(LEARNING_DATA_UPDATED_EVENT, refreshDashboard);
    return () =>
      window.removeEventListener(
        LEARNING_DATA_UPDATED_EVENT,
        refreshDashboard,
      );
  }, [loadDashboard]);

  const firstName = data?.student.name.split(" ")[0] || "learner";

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.38fr)] lg:items-end">
          <div className="animate-rise">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Dashboard
            </p>
            <h1 className="mt-2 font-heading page-title text-ink">
              {firstName}&apos;s study plan
            </h1>
          </div>
          <div className="animate-rise w-full [animation-delay:70ms] lg:max-w-md lg:justify-self-end">
            <TopicSearch compact />
          </div>
        </section>

        {error ? (
          <div
            className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800"
            role="alert"
          >
            <CircleAlert
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">Something needs attention</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-3 font-semibold underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {loading ? <DashboardSkeleton /> : null}

        {data ? (
          <>
            <StudentActionCenter data={data} />
            <LearningOverview data={data.learning} />
          </>
        ) : null}
      </main>
    </div>
  );
}
