'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
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
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-rise">
          <div>
            <p className="text-[13px] font-medium text-ink-mute">JEE learning studio</p>
            <h1 className="mt-1.5 font-heading text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.75rem]">
              Good to see you, {firstName}.
            </h1>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-soft transition hover:text-ink sm:self-auto"
          >
            View learning history
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <section className="mt-9 animate-rise" style={{ animationDelay: '60ms' }}>
          <TopicSearch />
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

        <GrowthPanel />
        <LearningOverview />
      </main>
    </div>
  );
}
