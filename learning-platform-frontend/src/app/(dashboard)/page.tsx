'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
  Radar,
  Route,
} from 'lucide-react';
import TopicSearch from '@/components/search/TopicSearch';
import LearningOverview from '@/components/learning/LearningOverview';
import GrowthPanel from '@/components/dashboard/GrowthPanel';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import type {
  DashboardPayload,
  DiagnosticAttemptPayload,
} from '@/lib/diagnostic-types';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await apiFetch<DashboardPayload>('/api/diagnostics/dashboard');
      setDashboard(data);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Your learning dashboard could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void apiFetch<DashboardPayload>('/api/diagnostics/dashboard')
      .then((data) => {
        if (!active) return;
        setDashboard(data);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : 'Your learning dashboard could not be loaded.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const startDiagnostic = async () => {
    setLaunching(true);
    setError(null);
    try {
      const payload = await apiFetch<DiagnosticAttemptPayload>('/api/diagnostics', {
        method: 'POST',
        body: JSON.stringify({ subject: 'Physics' }),
      });
      router.push('/diagnostic/' + payload.attempt.id);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The diagnostic could not be started.',
      );
      setLaunching(false);
    }
  };

  const firstName = user?.name.split(' ')[0] || 'learner';
  const diagnostic = dashboard?.diagnostic;
  const recentWeakTopics = Array.from(
    new Set(dashboard?.recentAttempts.flatMap((attempt) => attempt.weakTopics) ?? []),
  ).slice(0, 4);
  const shouldShowBaselinePrompt =
    loading ||
    Boolean(
      dashboard &&
        !dashboard.activeAttempt &&
        dashboard.stats.testsTaken === 0 &&
        dashboard.recentAttempts.length === 0,
    );

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16 lg:px-10">
        <section className="animate-rise rounded-[2rem] border border-hairline bg-surface p-5 shadow-[0_22px_70px_rgba(20,20,30,0.07)] sm:p-7">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                <Radar className="h-3.5 w-3.5" aria-hidden="true" />
                JEE AI command center
              </p>
              <h1 className="mt-4 font-heading text-[2.15rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[2.8rem]">
                Good to see you, {firstName}. Find the next best move.
              </h1>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3 lg:min-w-[23rem]">
              <div className="rounded-2xl bg-canvas p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                  Tests
                </p>
                {loading ? (
                  <div className="mt-2 h-7 w-12 rounded-full skeleton" />
                ) : (
                  <p className="mt-1 font-heading text-2xl font-semibold text-ink">
                    {dashboard?.stats.testsTaken ?? 0}
                  </p>
                )}
              </div>
              <div className="rounded-2xl bg-canvas p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                  Best
                </p>
                {loading ? (
                  <div className="mt-2 h-7 w-16 rounded-full skeleton" />
                ) : (
                  <p className="mt-1 font-heading text-2xl font-semibold text-ink">
                    {dashboard?.stats.bestScore == null ? '-' : `${dashboard.stats.bestScore}%`}
                  </p>
                )}
              </div>
              <Link
                href="/profile"
                className="group rounded-2xl bg-ink p-4 text-white transition hover:bg-ink/90"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
                  Record
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold">
                  Open
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </div>
          </header>

          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="rounded-[1.5rem] border border-hairline bg-canvas p-4 sm:p-5">
              <TopicSearch />
            </div>

            <aside className="rounded-[1.5rem] bg-ink p-5 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                  <Route className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
                    Next action
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {dashboard?.activeAttempt ? 'Finish active diagnostic' : 'Start from search'}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/70">
                {dashboard?.activeAttempt
                  ? `${dashboard.activeAttempt.answeredCount} answers saved. Resume before the timer expires.`
                  : 'Pick a concept or weak topic. The system will open the right topic workspace and place the student automatically.'}
              </p>
              <Link
                href={dashboard?.activeAttempt ? `/diagnostic/${dashboard.activeAttempt.id}` : '/learn'}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/90"
              >
                {dashboard?.activeAttempt ? 'Resume' : 'Open Learn'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </section>

        {error ? (
          <div
            className="mt-8 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800"
            role="alert"
          >
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
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

        {shouldShowBaselinePrompt ? (
          <section className="mt-6 rounded-2xl bg-surface p-5 hairline elevate-sm animate-rise" style={{ animationDelay: '120ms' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary">
                  <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">
                    New here? Start with a baseline diagnostic.
                  </p>
                  {loading ? (
                    <div className="mt-2 h-3 w-32 rounded-full skeleton" />
                  ) : (
                    <p className="mt-0.5 text-[13px] text-ink-soft">
                      {diagnostic?.questionCount ?? '-'} questions ·{' '}
                      {diagnostic?.durationMinutes ?? '-'} min
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void startDiagnostic()}
                disabled={launching || loading || Boolean(diagnostic && !diagnostic.ready)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-55"
              >
                {launching ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Start baseline
              </button>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-2xl bg-surface p-5 hairline elevate-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary">
                <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-mute">
                  Priority weak topics
                </p>
                {recentWeakTopics.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recentWeakTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-soft"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    Weak-topic chips appear here after real diagnostics or practice attempts.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-5 hairline elevate-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-mute">
              Product route
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Search opens Learn. Learn drives practice. Practice updates levels. Tests measure
              exam readiness. Notebook repairs mistakes.
            </p>
          </div>
        </section>

        <GrowthPanel />
        <LearningOverview />
      </main>
    </div>
  );
}
