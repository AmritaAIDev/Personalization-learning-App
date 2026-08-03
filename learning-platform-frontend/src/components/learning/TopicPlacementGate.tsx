'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ClipboardCheck, LoaderCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { learningUrl } from '@/lib/learning';
import type { LearningScope, LearningTab } from '@/lib/learning-types';
import type { DiagnosticAttemptPayload } from '@/lib/diagnostic-types';

type PlacementStatus = { needsDecision: boolean; currentLevel: number | null };

export default function TopicPlacementGate({
  scope,
  tab,
}: {
  scope: LearningScope;
  tab: LearningTab;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<PlacementStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(scope);
    void apiFetch<PlacementStatus>(`/api/learning/placement?${query.toString()}`)
      .then((value) => {
        setStatus(value);
        if (!value.needsDecision) router.replace(learningUrl(scope, { tab }));
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'The topic could not be prepared.'))
      .finally(() => setLoading(false));
  }, [router, scope, tab]);

  const startAtLevelOne = () => router.replace(learningUrl(scope, { tab }));

  const startPlacement = async () => {
    setLaunching(true);
    setError(null);
    try {
      const payload = await apiFetch<DiagnosticAttemptPayload>('/api/diagnostics', {
        method: 'POST',
        body: JSON.stringify({ ...scope, mode: 'TOPIC_PLACEMENT' }),
      });
      router.push(`/diagnostic/${payload.attempt.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The placement check could not be started.');
      setLaunching(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-10 sm:px-8">
      <section className="w-full rounded-[2rem] border border-hairline bg-surface p-6 shadow-[0_24px_72px_rgba(20,20,30,0.08)] sm:p-8">
        {loading ? (
          <div className="space-y-4"><div className="h-4 w-28 rounded-full skeleton" /><div className="h-10 w-3/4 rounded-full skeleton" /><div className="h-28 rounded-2xl skeleton" /></div>
        ) : null}
        {!loading && status?.needsDecision ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-tint text-primary"><ClipboardCheck className="h-6 w-6" /></span>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">New topic</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink">How should we place you in {scope.topic}?</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">Take a short placement check to begin at the level your answers support, or start from Level 1 and let adaptive practice build your route naturally.</p>
            {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p> : null}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => void startPlacement()} disabled={launching} className="rounded-2xl bg-ink p-5 text-left text-white transition hover:-translate-y-0.5 hover:bg-primary disabled:opacity-60">
                <span className="flex items-center justify-between text-sm font-semibold">Take placement check {launching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}</span>
                <span className="mt-2 block text-xs leading-5 text-white/65">15 reviewed questions. Your result can place this topic up to Level 9.</span>
              </button>
              <button type="button" onClick={startAtLevelOne} className="rounded-2xl border border-hairline bg-canvas p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-tint">
                <span className="text-sm font-semibold text-ink">Start at Level 1</span>
                <span className="mt-2 block text-xs leading-5 text-ink-mute">No assessment needed. Your first five-question set starts the route.</span>
              </button>
            </div>
          </>
        ) : null}
        {!loading && error && !status ? <button type="button" onClick={startAtLevelOne} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Start at Level 1</button> : null}
      </section>
    </div>
  );
}
