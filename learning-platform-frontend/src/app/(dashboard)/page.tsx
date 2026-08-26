"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import StudentActionCenter from "@/components/dashboard/StudentActionCenter";
import LearningOverview from "@/components/learning/LearningOverview";
import TopicSearch from "@/components/search/TopicSearch";
import { useAuth } from "@/context/AuthContext";
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
  const { user } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (user?.role === "admin") router.replace("/admin");
  }, [user?.role, router]);

  const firstName = data?.student.name.split(" ")[0] || "learner";

  if (user?.role === "admin") {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-canvas pb-20 premium-mesh">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.38fr)] lg:items-end">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
              Dashboard
            </p>
            <h1 className="mt-2 font-heading page-title text-ink">
              {firstName}&apos;s study plan
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Your personalised path — diagnostics, practice and review, all in one place.</p>
          </div>
          <div className="animate-rise w-full [animation-delay:70ms] lg:max-w-md lg:justify-self-end">
            <TopicSearch compact />
          </div>
        </section>

        {error ? (
          <div
            className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-tint p-4 text-sm text-danger premium-card"
            role="alert"
          >
            <CircleAlert
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">Something needs attention</p>
              <p className="mt-1 leading-6">{error}</p>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-danger px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-danger/90"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="animate-fade">
            <DashboardSkeleton />
          </div>
        ) : null}

        {data ? (
          <div className="animate-rise [animation-delay:120ms]">
            <StudentActionCenter data={data} />
            <div className="mt-8">
              <LearningOverview data={data.learning} />
            </div>
          </div>
        ) : null}

        {!loading && !error && !data ? (
          <div className="mt-8 animate-rise [animation-delay:140ms]">
            <div className="rounded-[1.5rem] border border-dashed border-hairline bg-surface/60 p-8 text-center premium-card">
              <p className="font-heading text-lg font-semibold text-ink">Your dashboard is getting ready</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">We’re preparing your personalised study plan. Pull to refresh or try again in a moment.</p>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
