'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  ClipboardList,
  LoaderCircle,
  NotebookTabs,
  PlayCircle,
  RotateCcw,
  Target,
  TimerReset,
} from 'lucide-react';
import PageHero from '@/components/product/PageHero';
import { ApiError, apiFetch } from '@/lib/api';
import type {
  DashboardPayload,
  DiagnosticAttemptPayload,
  HistoryItem,
} from '@/lib/diagnostic-types';

function formatDate(value: string | null) {
  if (!value) return 'Not completed';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

function scoreTone(score: number) {
  if (score >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
}

function TestsSkeleton() {
  return (
    <div className="mt-9 grid gap-4">
      <section className="rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
        <div className="h-5 w-44 animate-pulse rounded-full bg-ink/10" />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl bg-ink/8" />
          ))}
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-[0.62fr_0.38fr]">
        <div className="h-80 animate-pulse rounded-[1.65rem] bg-ink/8" />
        <div className="h-80 animate-pulse rounded-[1.65rem] bg-ink/8" />
      </div>
    </div>
  );
}

function HistoryCard({ attempt }: { attempt: HistoryItem }) {
  return (
    <Link
      href={`/analysis/${attempt.id}`}
      className="group rounded-2xl border border-hairline bg-canvas p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_30px_rgba(20,20,30,0.07)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-mute">
            {formatDate(attempt.completedAt)}
          </p>
          <h3 className="mt-2 text-sm font-semibold leading-6 text-ink">
            {attempt.title}
          </h3>
          <p className="mt-1 text-xs font-semibold text-ink-mute">
            {attempt.correctCount}/{attempt.totalQuestions} correct
          </p>
        </div>
        <span
          className={`rounded-2xl border px-3 py-2 font-heading text-xl font-semibold ${scoreTone(
            attempt.scorePercent,
          )}`}
        >
          {attempt.scorePercent}%
        </span>
      </div>
      {attempt.weakTopics.length > 0 ? (
        <p className="mt-3 text-xs font-semibold text-rose-700">
          Repair: {attempt.weakTopics.slice(0, 3).join(' · ')}
        </p>
      ) : (
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          No weak topics flagged in this attempt.
        </p>
      )}
    </Link>
  );
}

export default function TestsPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<DashboardPayload>('/api/diagnostics/dashboard');
        if (!cancelled) setDashboard(data);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Unable to load test details right now.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  async function startDiagnostic() {
    if (dashboard?.activeAttempt) {
      router.push(`/diagnostic/${dashboard.activeAttempt.id}`);
      return;
    }

    setLaunching(true);
    setError(null);
    try {
      const attempt = await apiFetch<DiagnosticAttemptPayload>('/api/diagnostics', {
        method: 'POST',
        body: JSON.stringify({ subject: dashboard?.stats.subject ?? 'Physics' }),
      });
      router.push(`/diagnostic/${attempt.attempt.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to start the baseline diagnostic.',
      );
    } finally {
      setLaunching(false);
    }
  }

  const weakTopics = useMemo(
    () =>
      Array.from(
        new Set(dashboard?.recentAttempts.flatMap((attempt) => attempt.weakTopics) ?? []),
      ).slice(0, 6),
    [dashboard],
  );

  const actionLabel = dashboard?.activeAttempt
    ? 'Resume baseline'
    : dashboard?.stats.testsTaken
      ? 'Retake baseline'
      : 'Start baseline';

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16 lg:px-10">
        <PageHero
          eyebrow="Tests"
          title="Turn every score into a repair plan."
          description="Baseline diagnostics, reviewed practice, and future mocks stay connected to Learn, Notebook, and weak-topic repair."
          action={
            <button
              type="button"
              onClick={() => void startDiagnostic()}
              disabled={launching || loading || Boolean(dashboard?.diagnostic && !dashboard.diagnostic.ready)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {launching ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {launching ? 'Opening test' : actionLabel}
            </button>
          }
        />

        {loading ? <TestsSkeleton /> : null}

        {!loading && error ? (
          <div className="mt-9 flex items-start gap-3 rounded-[1.65rem] border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Tests could not load</h2>
              <p className="mt-1 text-sm leading-6">{error}</p>
            </div>
          </div>
        ) : null}

        {!loading && dashboard ? (
          <>
            <section className="mt-9 rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    Test command center
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold text-ink">
                    {dashboard.stats.subject} readiness
                  </h2>
                </div>
                {dashboard.activeAttempt ? (
                  <Link
                    href={`/diagnostic/${dashboard.activeAttempt.id}`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    {dashboard.activeAttempt.answeredCount} saved answers
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-hairline bg-canvas p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink-mute">
                    <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
                    Tests taken
                  </p>
                  <p className="mt-3 font-heading text-3xl font-semibold text-ink">
                    {dashboard.stats.testsTaken}
                  </p>
                </div>
                <div className="rounded-2xl border border-hairline bg-canvas p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink-mute">
                    <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                    Best score
                  </p>
                  <p className="mt-3 font-heading text-3xl font-semibold text-ink">
                    {dashboard.stats.bestScore == null ? '-' : `${dashboard.stats.bestScore}%`}
                  </p>
                </div>
                <div className="rounded-2xl border border-hairline bg-canvas p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink-mute">
                    <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
                    Average
                  </p>
                  <p className="mt-3 font-heading text-3xl font-semibold text-ink">
                    {dashboard.stats.averageScore == null
                      ? '-'
                      : `${dashboard.stats.averageScore}%`}
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.62fr_0.38fr]">
              <section className="rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
                  Test modes
                </p>
                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={() => void startDiagnostic()}
                    disabled={launching || Boolean(dashboard.diagnostic && !dashboard.diagnostic.ready)}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary-tint p-5 text-left transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-primary">
                        <ClipboardList className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block font-heading text-xl font-semibold text-ink">
                          Baseline diagnostic
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-ink-soft">
                          {dashboard.diagnostic.questionCount} questions ·{' '}
                          {dashboard.diagnostic.durationMinutes} min · readiness map
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-primary" aria-hidden="true" />
                  </button>

                  <Link
                    href="/practice"
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-canvas p-5 transition hover:border-primary/30 hover:bg-white"
                  >
                    <span className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-primary">
                        <TimerReset className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block font-heading text-xl font-semibold text-ink">
                          Reviewed practice test
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-ink-soft">
                          Balanced Easy, Medium, Hard set from the reviewed question bank.
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-primary" aria-hidden="true" />
                  </Link>

                  <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-5">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-ink-mute">
                        <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-heading text-xl font-semibold text-ink">
                          Full-length mock
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-ink-soft">
                          Planned mode. It should reuse the same analysis and repair flow once mock-test schema is added.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-4">
                <section className="rounded-[1.65rem] bg-ink p-6 text-white shadow-[0_14px_34px_rgba(20,20,30,0.12)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
                      <Brain className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                        Repair queue
                      </p>
                      <h2 className="mt-1 font-heading text-xl font-semibold">
                        {weakTopics.length ? `${weakTopics.length} weak topics` : 'No weak topics yet'}
                      </h2>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    {weakTopics.length ? (
                      weakTopics.map((topic) => (
                        <Link
                          key={topic}
                          href={`/learn?topic=${encodeURIComponent(topic)}`}
                          className="block rounded-2xl bg-white/8 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/12"
                        >
                          {topic}
                        </Link>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-white/8 p-4 text-sm leading-6 text-white/70">
                        Complete a diagnostic or practice test and weak-topic repair links will appear here.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
                    After test
                  </p>
                  <div className="mt-4 grid gap-3">
                    <Link
                      href="/notebook"
                      className="flex items-center justify-between rounded-2xl border border-hairline bg-canvas px-4 py-3 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
                    >
                      <span className="inline-flex items-center gap-2">
                        <NotebookTabs className="h-4 w-4" aria-hidden="true" />
                        Review mistakes
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/practice"
                      className="flex items-center justify-between rounded-2xl border border-hairline bg-canvas px-4 py-3 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
                    >
                      <span className="inline-flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Practice weak topics
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </section>
              </aside>
            </div>

            <section className="mt-4 rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
                    Recent analysis
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold text-ink">
                    Submitted diagnostic history
                  </h2>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-hairline px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
                >
                  Full history
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {dashboard.recentAttempts.length ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {dashboard.recentAttempts.map((attempt) => (
                    <HistoryCard key={attempt.id} attempt={attempt} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-hairline bg-canvas p-6 text-sm leading-6 text-ink-mute">
                  No submitted diagnostic yet. Start the baseline to create the first real test record.
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
