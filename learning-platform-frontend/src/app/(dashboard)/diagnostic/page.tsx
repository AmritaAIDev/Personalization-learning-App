'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ClipboardCheck, Clock3, LoaderCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { DashboardPayload, DiagnosticAttemptPayload } from '@/lib/diagnostic-types';

export default function DiagnosticStartPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<DashboardPayload>('/api/diagnostics/dashboard');
      setDashboard(data);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load the diagnostic.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialDiagnostic = async () => {
      await load();
    };
    void loadInitialDiagnostic();
  }, [load]);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const attempt = await apiFetch<DiagnosticAttemptPayload>('/api/diagnostics', {
        method: 'POST',
        body: JSON.stringify({ subject: 'Physics' }),
      });
      router.push(`/diagnostic/${attempt.attempt.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start the diagnostic.');
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm font-semibold text-[#6b6e75]"><span className="flex items-center gap-3"><LoaderCircle className="h-5 w-5 animate-spin text-[#e31540]" /> Loading diagnostic details…</span></div>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center p-5 sm:p-8">
      <section className="w-full overflow-hidden rounded-[2rem] border border-[#e8e1e3] bg-white shadow-[0_22px_52px_rgba(49,51,55,0.1)]">
        <div className="relative overflow-hidden bg-[#313337] p-7 text-white sm:p-10">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(227,21,64,0.45),transparent_45%)]" />
          <div className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#e31540]"><ClipboardCheck className="h-6 w-6" aria-hidden="true" /></span>
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-[#f7b9c8]">Diagnostic readiness</p>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{dashboard?.diagnostic.title ?? 'Physics diagnostic'}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d6d7da]">Answer one question at a time.</p>
          </div>
        </div>
        <div className="p-7 sm:p-10">
          {error && <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f7f4f5] p-5"><p className="flex items-center gap-2 text-sm font-semibold text-[#6b6e75]"><ClipboardCheck className="h-4 w-4 text-[#e31540]" aria-hidden="true" /> Questions</p><p className="mt-3 font-heading text-3xl font-bold text-[#313337]">{dashboard?.diagnostic.questionCount ?? '—'}</p></div>
            <div className="rounded-2xl bg-[#f7f4f5] p-5"><p className="flex items-center gap-2 text-sm font-semibold text-[#6b6e75]"><Clock3 className="h-4 w-4 text-[#e31540]" aria-hidden="true" /> Time limit</p><p className="mt-3 font-heading text-3xl font-bold text-[#313337]">{dashboard?.diagnostic.durationMinutes ?? '—'} min</p></div>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {dashboard?.activeAttempt ? <p className="text-sm font-medium text-amber-700">Saved attempt ready.</p> : <p className="text-sm text-[#6b6e75]">Ready when you are.</p>}
            <button type="button" onClick={() => void start()} disabled={starting || !dashboard?.diagnostic.ready} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-60">
              {starting ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <>{dashboard?.activeAttempt ? 'Resume diagnostic' : 'Begin diagnostic'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
