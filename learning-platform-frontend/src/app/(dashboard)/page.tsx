'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CircleAlert,
  ClipboardCheck,
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
  const shouldShowBaselinePrompt =
    loading ||
    Boolean(
      dashboard &&
        !dashboard.activeAttempt &&
        dashboard.stats.testsTaken === 0 &&
        dashboard.recentAttempts.length === 0,
    );

  return (
    <div className="min-h-screen overflow-hidden bg-[#fafafa] pb-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(227,21,64,0.09),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[linear-gradient(to_right,rgba(49,51,55,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(49,51,55,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,white,transparent_88%)]"
      />

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
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 self-start text-sm font-bold text-[#6b6e75] transition hover:text-[#e31540] sm:self-auto"
          >
            View learning history
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <section className="pt-7 text-center sm:pt-10">
          <div className="text-left">
            <TopicSearch />
          </div>
        </section>

        {error ? (
          <div
            className="mt-8 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800"
            role="alert"
          >
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
        ) : null}

        {shouldShowBaselinePrompt ? (
          <section className="mt-7 rounded-2xl border border-[#f0d6dc] bg-[#fff7f9] px-4 py-3 shadow-[0_14px_32px_rgba(227,21,64,0.08)] transition-all duration-300 ease-out">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e31540] text-white">
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#313337]">
                    New here? Start with a baseline diagnostic.
                  </p>
                  {loading ? (
                    <div className="mt-2 h-3 w-32 animate-pulse rounded-full bg-[#f0d6dc]" />
                  ) : (
                    <p className="mt-0.5 text-xs font-semibold text-[#6b6e75]">
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
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.20)] transition hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {launching ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Start baseline
              </button>
            </div>
          </section>
        ) : null}

        <LearningOverview />
      </main>
    </div>
  );
}
