"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import {
  ArrowRight,
  BarChart3,
  CircleAlert,
  Target,
  TrendingUp,
} from "lucide-react";
import GrowthPanel from "@/components/dashboard/GrowthPanel";
import { apiFetch } from "@/lib/api";
import type { DashboardPayload } from "@/lib/diagnostic-types";
import type { GrowthPayload, TopicCompetency } from "@/lib/growth-types";
import { learningUrl } from "@/lib/learning";
import { useApiResource } from "@/lib/useApiResource";

function rankTopics(topics: TopicCompetency[]) {
  return topics
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 6);
}

type AnalyticsData = { growth: GrowthPayload; dashboard: DashboardPayload };

export default function AnalyticsPage() {
  const fetchAnalytics = useCallback(async (): Promise<AnalyticsData> => {
    const [growthData, dashboardData] = await Promise.all([
      apiFetch<GrowthPayload>("/api/learning/growth"),
      apiFetch<DashboardPayload>("/api/diagnostics/dashboard"),
    ]);
    return { growth: growthData, dashboard: dashboardData };
  }, []);
  const { data, loading, error, reload: load } = useApiResource(
    fetchAnalytics,
    "Analytics could not be loaded.",
  );
  const growth = data?.growth ?? null;
  const dashboard = data?.dashboard ?? null;

  const weakTopics = useMemo(
    () => rankTopics(growth?.topics ?? []),
    [growth?.topics],
  );

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <header className="grid gap-5 lg:grid-cols-[1fr_0.42fr] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Analytics
            </p>
            <h1 className="mt-2 font-heading page-title text-ink">
              How you&apos;re progressing
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-mute">
              Topic readiness, weak areas, and momentum at a glance.
            </p>
          </div>
          <Link
            href="/tests"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Open tests
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        {loading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-32 rounded-[1.35rem] border border-hairline bg-white p-5"
              >
                <div className="h-4 w-24 rounded-full skeleton" />
                <div className="mt-5 h-9 w-20 rounded-full skeleton" />
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
            <CircleAlert
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">Analytics needs attention</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 font-semibold underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {!loading && growth ? (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-4">
              <article className="rounded-[1.35rem] border border-hairline bg-white p-5 shadow-[0_18px_48px_rgba(20,20,30,0.04)]">
                <BarChart3
                  className="h-5 w-5 text-primary"
                  aria-hidden="true"
                />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-mute">
                  Overall
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold text-ink">
                  {growth.overall.score}%
                </p>
              </article>
              <article className="rounded-[1.35rem] border border-hairline bg-white p-5 shadow-[0_18px_48px_rgba(20,20,30,0.04)]">
                <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-mute">
                  Topics
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold text-ink">
                  {growth.overall.topicsTracked}
                </p>
              </article>
              <article className="rounded-[1.35rem] border border-hairline bg-white p-5 shadow-[0_18px_48px_rgba(20,20,30,0.04)]">
                <TrendingUp
                  className="h-5 w-5 text-primary"
                  aria-hidden="true"
                />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-mute">
                  Momentum
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold text-ink">
                  {growth.overall.momentum > 0 ? "+" : ""}
                  {growth.overall.momentum}
                </p>
              </article>
              <article className="rounded-[1.35rem] border border-hairline bg-white p-5 shadow-[0_18px_48px_rgba(20,20,30,0.04)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-mute">
                  Best test
                </p>
                <p className="mt-6 font-heading text-3xl font-semibold text-ink">
                  {dashboard?.stats.bestScore == null
                    ? "-"
                    : `${dashboard.stats.bestScore}%`}
                </p>
              </article>
            </section>

            <section className="mt-5">
              <article className="rounded-[1.55rem] border border-hairline bg-white p-6 shadow-[0_18px_48px_rgba(20,20,30,0.05)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Weak-topic queue
                </p>
                <div className="mt-5 space-y-3">
                  {weakTopics.length > 0 ? (
                    weakTopics.map((topic) => (
                      <Link
                        key={`${topic.chapter}-${topic.topic}`}
                        href={learningUrl(
                          {
                            subject: topic.subject,
                            chapter: topic.chapter,
                            topic: topic.topic,
                          },
                          { tab: "practice" },
                        )}
                        className="block rounded-2xl border border-hairline bg-canvas p-4 transition hover:border-primary/30 hover:bg-white"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-ink">
                              {topic.topic}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-mute">
                              {topic.chapter} · Level {topic.level}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-primary">
                            {topic.score}%
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-hairline bg-canvas p-5 text-sm leading-6 text-ink-soft">
                      No weak topics are available yet.
                    </p>
                  )}
                </div>
              </article>
            </section>

            <GrowthPanel />
          </>
        ) : null}
      </main>
    </div>
  );
}
