'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  Sparkles,
} from 'lucide-react';
import TopicSearch from '@/components/search/TopicSearch';
import LearningOverview from '@/components/learning/LearningOverview';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import type {
  DashboardPayload,
  DiagnosticAttemptPayload,
} from '@/lib/diagnostic-types';
import { formatDate } from '@/lib/format';

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
}) {
  return (
    <article className="rounded-2xl border border-[#e9e2e4] bg-white p-4 shadow-[0_8px_22px_rgba(49,51,55,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f939b]">
            {label}
          </p>
          <p className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#313337]">
            {value}
          </p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f9e5ea] text-[#e31540]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

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

  return (
    <div className="min-h-screen overflow-hidden bg-[#fafafa] pb-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(227,21,64,0.09),transparent_58%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[linear-gradient(to_right,rgba(49,51,55,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(49,51,55,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,white,transparent_88%)]" />

      <main className="relative mx-auto w-full max-w-7xl px-5 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        <header className="flex flex-col gap-5 border-b border-[#e8e2e4] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e31540]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              JEE learning studio
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-[#313337] sm:text-4xl">
              Good to see you, {firstName}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b6e75]">
              Search a verified concept to begin an adaptive journey, or take a
              baseline diagnostic to map the next best step.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 self-start text-sm font-bold text-[#6b6e75] transition hover:text-[#e31540] sm:self-auto"
          >
            View learning history
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <section className="pt-10 text-center sm:pt-14">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#8f939b]">
            Find your next challenge
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-[#313337] sm:text-5xl">
            What do you want to master today?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#6b6e75] sm:text-base">
            Pick a topic, continue practice, or review your progress.
          </p>
          <div className="mt-8 text-left sm:mt-10">
            <TopicSearch />
          </div>
        </section>

        {error && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">Something needs attention</p>
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
        )}

        <section className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="overflow-hidden rounded-[2rem] bg-[#313337] p-6 text-white shadow-[0_24px_54px_rgba(49,51,55,0.18)] sm:p-8">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f7b9c8]">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Baseline diagnostic
            </p>
            <h2 className="mt-3 max-w-xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Baseline check
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#d6d7da]">
              A focused assessment for your current Physics readiness.
            </p>

            <div className="mt-7 grid max-w-md gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-[#d6d7da]">
                  <ClipboardCheck className="h-4 w-4 text-[#f7b9c8]" aria-hidden="true" />
                  Questions
                </p>
                <p className="mt-2 font-heading text-2xl font-bold">
                  {loading ? '...' : diagnostic?.questionCount ?? '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-[#d6d7da]">
                  <Clock3 className="h-4 w-4 text-[#f7b9c8]" aria-hidden="true" />
                  Time limit
                </p>
                <p className="mt-2 font-heading text-2xl font-bold">
                  {loading ? '...' : diagnostic?.durationMinutes ?? '—'} min
                </p>
              </div>
            </div>

            {dashboard?.activeAttempt ? (
              <Link
                href={'/diagnostic/' + dashboard.activeAttempt.id}
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#313337] transition hover:-translate-y-px hover:bg-[#fff2f5]"
              >
                Resume diagnostic
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void startDiagnostic()}
                disabled={launching || Boolean(diagnostic && !diagnostic.ready)}
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#e31540] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(227,21,64,0.28)] transition hover:-translate-y-px hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {launching ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                )}
                Start baseline
              </button>
            )}
          </article>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Metric
              label="Diagnostics completed"
              value={loading ? '...' : dashboard?.stats.testsTaken || 0}
              icon={Activity}
            />
            <Metric
              label="Best score"
              value={
                loading
                  ? '...'
                  : dashboard?.stats.bestScore === null || dashboard?.stats.bestScore === undefined
                    ? 'Not yet'
                    : String(dashboard.stats.bestScore) + '%'
              }
              icon={BookOpenCheck}
            />
            <article className="rounded-2xl border border-[#e9e2e4] bg-white p-5 shadow-[0_8px_22px_rgba(49,51,55,0.04)] sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f939b]">
                Last diagnostic
              </p>
              {loading ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#6b6e75]">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#e31540]" aria-hidden="true" />
                  Loading progress
                </p>
              ) : dashboard?.recentAttempts[0] ? (
                <Link
                  href={'/analysis/' + dashboard.recentAttempts[0].id}
                  className="mt-3 block rounded-xl bg-[#f7f4f5] p-3 transition hover:bg-[#f9e5ea]"
                >
                  <span className="block text-sm font-bold text-[#313337]">
                    {dashboard.recentAttempts[0].scorePercent}% score
                  </span>
                  <span className="mt-1 block text-xs text-[#6b6e75]">
                    {formatDate(dashboard.recentAttempts[0].completedAt)}
                  </span>
                </Link>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#6b6e75]">
                  No baseline completed yet.
                </p>
              )}
            </article>
          </section>
        </section>

        <LearningOverview />
      </main>
    </div>
  );
}
