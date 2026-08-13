"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  Play,
  Trophy,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  DashboardPayload,
  DiagnosticAttemptPayload,
  HistoryItem,
} from "@/lib/diagnostic-types";

function formatDate(value: string | null) {
  if (!value) return "Not completed";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function scoreTone(score: number) {
  if (score >= 70) return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (score >= 40) return "bg-amber-50 text-amber-800 ring-amber-100";
  return "bg-rose-50 text-rose-700 ring-rose-100";
}

function TestRecord({ attempt }: { attempt: HistoryItem }) {
  return (
    <Link
      href={`/analysis/${attempt.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-hairline bg-canvas px-4 py-3.5 transition hover:border-primary/30 hover:bg-white hover:shadow-[0_12px_26px_rgba(20,20,30,0.06)]"
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold ring-1 ${scoreTone(attempt.scorePercent)}`}
      >
        {attempt.scorePercent}%
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">
          {attempt.correctCount}/{attempt.totalQuestions} correct
        </span>
        <span className="mt-0.5 block text-xs font-semibold text-ink-mute">
          {formatDate(attempt.completedAt)} ·{" "}
          {attempt.weakTopics.length
            ? `${attempt.weakTopics.length} areas to repair`
            : "No repair areas flagged"}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}

function TestsSkeleton() {
  return (
    <div className="mt-7 grid gap-4">
      <div className="h-64 rounded-[1.8rem] skeleton" />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-56 rounded-[1.5rem] skeleton" />
        <div className="h-56 rounded-[1.5rem] skeleton" />
      </div>
    </div>
  );
}

export default function TestsPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDashboard(
        await apiFetch<DashboardPayload>("/api/diagnostics/dashboard"),
      );
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Tests could not be loaded right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  const startOrResume = async () => {
    if (!dashboard || launching) return;
    if (dashboard.activeAttempt) {
      router.push(`/diagnostic/${dashboard.activeAttempt.id}`);
      return;
    }
    setLaunching(true);
    setError(null);
    try {
      const payload = await apiFetch<DiagnosticAttemptPayload>(
        "/api/diagnostics",
        {
          method: "POST",
          body: JSON.stringify({ subject: "Physics" }),
        },
      );
      router.push(`/diagnostic/${payload.attempt.id}`);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Your test could not be opened.",
      );
    } finally {
      setLaunching(false);
    }
  };

  const latestAttempt = dashboard?.recentAttempts[0] ?? null;
  const repairTopics = useMemo(
    () => latestAttempt?.weakTopics.slice(0, 4) ?? [],
    [latestAttempt],
  );
  const canStart = Boolean(
    dashboard?.diagnostic.ready || dashboard?.activeAttempt,
  );
  const actionLabel = dashboard?.activeAttempt
    ? "Resume test"
    : dashboard?.stats.testsTaken
      ? "Start another test"
      : "Start test";

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-8 sm:px-8 sm:pt-10 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading page-title text-ink">
              Test centre
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void startOrResume()}
            disabled={loading || launching || !canStart}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(20,20,30,0.16)] transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {launching ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : dashboard?.activeAttempt ? (
              <Play className="h-4 w-4" />
            ) : (
              <ClipboardCheck className="h-4 w-4" />
            )}
            {launching ? "Opening test" : actionLabel}
          </button>
        </header>

        {loading ? <TestsSkeleton /> : null}
        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Something interrupted Tests</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-3 font-bold underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {!loading && dashboard ? (
          <>
            <section className="mt-7 overflow-hidden rounded-[1.8rem] bg-ink p-5 text-white shadow-[0_18px_45px_rgba(20,20,30,0.16)] sm:p-7">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                    {dashboard.activeAttempt
                      ? "Test in progress"
                      : "Next assessment"}
                  </p>
                  <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                    {dashboard.diagnostic.title}
                  </h2>
                  <p className="mt-2 text-sm text-white/65">
                    {dashboard.diagnostic.chapters.join(" · ")}
                  </p>
                </div>
                {dashboard.activeAttempt ? (
                  <Link
                    href={`/diagnostic/${dashboard.activeAttempt.id}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-primary-tint"
                  >
                    {dashboard.activeAttempt.answeredCount} answers saved{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
              <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 sm:max-w-md sm:gap-3">
                <span className="rounded-xl bg-white/8 px-3 py-3">
                  <span className="block text-lg font-bold">
                    {dashboard.diagnostic.questionCount}
                  </span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.13em] text-white/50">
                    Questions
                  </span>
                </span>
                <span className="rounded-xl bg-white/8 px-3 py-3">
                  <span className="block text-lg font-bold">
                    {dashboard.diagnostic.durationMinutes} min
                  </span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.13em] text-white/50">
                    Timed
                  </span>
                </span>
                <span className="rounded-xl bg-white/8 px-3 py-3">
                  <span className="block text-lg font-bold">3 tiers</span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.13em] text-white/50">
                    Balanced
                  </span>
                </span>
              </div>
            </section>

            <Link
              href="/mock-test"
              className="group mt-4 flex items-center gap-4 rounded-[1.55rem] border border-hairline bg-surface p-5 shadow-[0_12px_30px_rgba(20,20,30,0.045)] transition hover:border-primary/30 hover:shadow-[0_16px_36px_rgba(20,20,30,0.08)] sm:p-6"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-tint text-primary">
                <Trophy className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Full mock test
                </span>
                <span className="mt-1 block font-heading text-lg font-bold text-ink">
                  Physics + Chemistry + Maths, JEE-style negative marking
                </span>
                <span className="mt-1 block text-sm text-ink-soft">
                  See your percentile against other test-takers on this
                  platform and exactly which chapters cost you marks.
                </span>
              </span>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>

            {!dashboard.diagnostic.ready && !dashboard.activeAttempt ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Your next test is being prepared</p>
                  <p className="mt-1 leading-6">
                    It will open when the reviewed question bank has balanced
                    coverage across all three difficulty tiers.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
              <section className="rounded-[1.55rem] border border-hairline bg-surface p-5 shadow-[0_12px_30px_rgba(20,20,30,0.045)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute">
                  Your record
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div>
                    <p className="font-heading text-2xl font-bold text-ink">
                      {dashboard.stats.testsTaken}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-ink-mute">
                      Taken
                    </p>
                  </div>
                  <div>
                    <p className="font-heading text-2xl font-bold text-ink">
                      {dashboard.stats.bestScore == null
                        ? "—"
                        : `${dashboard.stats.bestScore}%`}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-ink-mute">
                      Best
                    </p>
                  </div>
                  <div>
                    <p className="font-heading text-2xl font-bold text-ink">
                      {dashboard.stats.averageScore == null
                        ? "—"
                        : `${dashboard.stats.averageScore}%`}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-ink-mute">
                      Average
                    </p>
                  </div>
                </div>
                <div className="mt-6 border-t border-hairline pt-5">
                  <Link
                    href="/notebook"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-strong"
                  >
                    <BookOpenCheck className="h-4 w-4" /> Open mistake notebook{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </section>
              <section className="rounded-[1.55rem] border border-hairline bg-surface p-5 shadow-[0_12px_30px_rgba(20,20,30,0.045)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute">
                      Recent tests
                    </p>
                    <h2 className="mt-1 font-heading text-xl font-bold text-ink">
                      Your learning record
                    </h2>
                  </div>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-5 grid gap-2">
                  {dashboard.recentAttempts.length ? (
                    dashboard.recentAttempts.map((attempt) => (
                      <TestRecord key={attempt.id} attempt={attempt} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-5 text-sm leading-6 text-ink-mute">
                      Your submitted tests will appear here with their score and
                      repair areas.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {latestAttempt ? (
              <section className="mt-4 flex flex-col gap-4 rounded-[1.55rem] border border-primary/15 bg-primary-tint/35 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    From your latest test
                  </p>
                  <h2 className="mt-2 font-heading text-xl font-bold text-ink">
                    {repairTopics.length
                      ? "Repair the concepts that cost marks"
                      : "Keep the momentum going"}
                  </h2>
                  {repairTopics.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {repairTopics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-primary/10"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ink-soft">
                      No weak concepts were flagged in the latest test.
                    </p>
                  )}
                </div>
                <Link
                  href={`/analysis/${latestAttempt.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-strong"
                >
                  View test analysis <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
