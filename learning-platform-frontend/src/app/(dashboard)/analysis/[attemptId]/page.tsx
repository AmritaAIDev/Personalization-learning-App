'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, CircleAlert, LoaderCircle, RotateCcw, Target } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { AnalysisPayload } from '@/lib/diagnostic-types';
import { formatDateTime } from '@/lib/format';
import BloomRadar from '@/components/diagnostic/BloomRadar';
import PerformanceBars from '@/components/diagnostic/PerformanceBars';
import ScoreRing from '@/components/diagnostic/ScoreRing';

const gradeMessage = {
  Excellent: 'You have a strong command of the measured Electrostatics concepts.',
  Good: 'Your foundation is sound; use the topic breakdown to sharpen the remaining gaps.',
  Average: 'You have important working knowledge and clear opportunities to consolidate it.',
  'Needs work': 'Use the recommended resources to rebuild the concepts before your next attempt.',
};

export default function AnalysisPage() {
  const params = useParams<{ attemptId: string }>();
  const [result, setResult] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!params.attemptId) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await apiFetch<AnalysisPayload>(`/api/diagnostics/${params.attemptId}/analysis`));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load this analysis.');
    } finally {
      setLoading(false);
    }
  }, [params.attemptId]);

  useEffect(() => {
    const loadInitialAnalysis = async () => {
      await load();
    };
    void loadInitialAnalysis();
  }, [load]);

  if (loading) return <div className="grid min-h-screen place-items-center text-sm font-semibold text-[#6b6e75]"><span className="flex items-center gap-3"><LoaderCircle className="h-5 w-5 animate-spin text-[#e31540]" /> Calculating your analysis…</span></div>;

  if (!result) {
    return <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center"><CircleAlert className="h-8 w-8 text-rose-600" aria-hidden="true" /><h1 className="mt-4 font-heading text-2xl font-bold text-[#313337]">Analysis unavailable</h1><p className="mt-2 text-sm text-[#6b6e75]">{error ?? 'Please try again.'}</p><button type="button" onClick={() => void load()} className="mt-5 rounded-xl bg-[#e31540] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#c61137]">Try again</button></div>;
  }

  const { analysis, attempt } = result;
  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#313337] p-6 text-white shadow-[0_20px_48px_rgba(49,51,55,0.18)] sm:p-9">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(227,21,64,0.48),transparent_45%)]" />
        <div className="relative grid gap-7 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <ScoreRing score={analysis.scorePercent} />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f7b9c8]">Diagnostic complete</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{analysis.grade}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#e7e8ea]">{gradeMessage[analysis.grade]}</p>
            <p className="mt-5 text-sm font-semibold text-white">{analysis.correct} correct · {analysis.incorrect} incorrect · {analysis.total} total</p>
          </div>
          <p className="self-start text-xs font-medium text-[#f7b9c8]">Submitted {formatDateTime(attempt.submittedAt)}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Score summary">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-sm font-semibold text-emerald-800">Correct answers</p><p className="mt-2 font-heading text-3xl font-bold text-emerald-950">{analysis.correct}</p></div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="text-sm font-semibold text-rose-800">Incorrect answers</p><p className="mt-2 font-heading text-3xl font-bold text-rose-950">{analysis.incorrect}</p></div>
        <div className="rounded-2xl border border-[#f2b6c5] bg-[#fff5f7] p-5"><p className="text-sm font-semibold text-[#a61231]">Topics to revisit</p><p className="mt-2 font-heading text-3xl font-bold text-[#83112b]">{analysis.weakTopics.length}</p></div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <PerformanceBars title="Topic performance" description="Strong: 70% or higher · Average: 40–69% · Weak: below 40%. Recommendations use the under-50% threshold from the diagnostic." rows={analysis.topicPerformance} />
        <BloomRadar rows={analysis.bloomPerformance} />
      </section>

      <section className="mt-8 rounded-2xl border border-[#e8e1e3] bg-white p-6 shadow-[0_8px_22px_rgba(49,51,55,0.04)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-[#313337]"><Target className="h-4 w-4 text-[#e31540]" aria-hidden="true" /> Your next step</p>
            <h2 className="mt-2 font-heading text-xl font-bold text-[#313337]">{analysis.weakTopics.length > 0 ? 'Focus on the topics below 50%.' : 'Keep reinforcing your strong foundation.'}</h2>
            <p className="mt-1 text-sm leading-6 text-[#6b6e75]">{analysis.weakTopics.length > 0 ? analysis.weakTopics.join(' · ') : 'Use the general revision resources to maintain momentum.'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/recommendations/${attempt.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#c61137]">View recommendations <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href="/diagnostic" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dcdde0] px-4 py-2.5 text-sm font-bold text-[#55585f] hover:bg-[#f7f4f5]"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Retake</Link>
          </div>
        </div>
      </section>
      <p className="mt-5 flex items-center gap-2 text-xs text-[#6b6e75]"><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> This report is derived from the answers saved to your account, not client-side scoring.</p>
    </div>
  );
}
