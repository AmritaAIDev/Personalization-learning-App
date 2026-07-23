'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Target,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { practiceHref } from '@/lib/practice';
import type { PracticePerformanceRow, PracticeReviewPayload } from '@/lib/practice-types';

function PerformanceRow({ row }: { row: PracticePerformanceRow }) {
  const color = row.status === 'strong' ? '#15803d' : row.status === 'average' ? '#b45309' : '#3f6f57';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-[#52525b]">{row.label}</span>
        <span className="font-bold" style={{ color }}>{row.correct}/{row.total} · {row.score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#edf0f1]">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${row.score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function PracticeReview({ attemptId }: { attemptId: string }) {
  const [payload, setPayload] = useState<PracticeReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReview = useCallback(async () => {
    try {
      const data = await apiFetch<PracticeReviewPayload>(
        `/api/practice/sessions/${attemptId}/review`,
      );
      setPayload(data);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'The practice review could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    let active = true;
    void apiFetch<PracticeReviewPayload>(`/api/practice/sessions/${attemptId}/review`)
      .then((data) => {
        if (!active) return;
        setPayload(data);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : 'The practice review could not be loaded.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-sm font-semibold text-[#52525b]">
        <span className="flex items-center gap-3"><LoaderCircle className="h-5 w-5 animate-spin text-[#3f6f57]" aria-hidden="true" /> Calculating your review…</span>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
        <CircleAlert className="h-9 w-9 text-[#3f6f57]" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-[#1a1a1f]">We could not show this review</h1>
        <p className="mt-2 text-sm leading-6 text-[#52525b]">{error ?? 'This practice session may not be ready for review.'}</p>
        <button type="button" onClick={() => void loadReview()} className="mt-6 rounded-xl bg-[#3f6f57] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#315844]">Try again</button>
      </div>
    );
  }

  const { analysis, attempt, results } = payload;
  const repeatHref = practiceHref({
    subject: attempt.subject,
    chapter: attempt.chapter,
    topic: attempt.topic,
  });

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <header className="flex flex-col gap-5 border-b border-[#ececf0] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium text-ink-mute"><Target className="h-4 w-4" aria-hidden="true" /> Practice review</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#1a1a1f] sm:text-4xl">{attempt.topic}</h1>
          <p className="mt-3 text-sm leading-6 text-[#52525b]">Review your score and explanations.</p>
        </div>
        <Link href={repeatHref} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#1a1a1f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2a2a30] lg:self-auto">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Practice again
        </Link>
      </header>

      <section className="mt-7 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[2rem] bg-[#1a1a1f] p-7 text-white shadow-[0_20px_48px_rgba(20, 20, 30,0.18)] sm:p-8">
          <p className="text-xs font-medium text-white/55">{analysis.grade}</p>
          <p className="mt-4 font-heading text-6xl font-bold tracking-tight">{analysis.scorePercent}%</p>
          <p className="mt-3 text-sm text-[#e5e5ea]">{analysis.correct} correct · {analysis.incorrect} to revisit · {analysis.total} total</p>
          <p className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[#e7e8ea]">Review each explanation while the reasoning is fresh.</p>
        </article>

        <article className="rounded-[2rem] border border-[#ececf0] bg-white p-6 shadow-[0_14px_34px_rgba(20, 20, 30,0.05)] sm:p-7">
          <h2 className="font-heading text-xl font-bold text-[#1a1a1f]">Performance by difficulty</h2>
          <div className="mt-6 space-y-5">
            {analysis.difficultyPerformance.map((row) => <PerformanceRow key={row.label} row={row} />)}
          </div>
          <h2 className="mt-8 border-t border-[#ececf0] pt-6 font-heading text-xl font-bold text-[#1a1a1f]">Thinking skills</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {analysis.bloomPerformance.map((row) => <PerformanceRow key={row.label} row={row} />)}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-[#ececf0] bg-[#fffafa] p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium text-ink-mute"><Lightbulb className="h-4 w-4" aria-hidden="true" /> Focus next</p>
            <h2 className="mt-2 font-heading text-xl font-bold text-[#1a1a1f]">Concepts that need another pass</h2>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#3f6f57] hover:text-[#315844]">Choose another unit <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        {analysis.weakConcepts.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {analysis.weakConcepts.map((concept) => <span key={concept} className="rounded-full bg-[#e7efe9] px-3 py-2 text-sm font-bold text-[#2c4c3d]">{concept}</span>)}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-[#52525b]">No concept fell below 50% in this session. Keep building speed and consistency with another reviewed set.</p>
        )}
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-2 border-b border-[#ececf0] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-ink-mute">Question-by-question review</p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#1a1a1f]">Learn from the reasoning</h2>
          </div>
          <p className="text-sm text-[#52525b]">Open a question to review it.</p>
        </div>
        <div className="mt-5 space-y-3">
          {results.map((result) => (
            <details key={result.questionId} className="group rounded-2xl border border-[#ececf0] bg-white shadow-[0_6px_18px_rgba(20, 20, 30,0.035)]">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-5 sm:p-6">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${result.isCorrect ? 'bg-[#e8f5ed] text-emerald-700' : 'bg-[#e7efe9] text-[#3f6f57]'}`}>
                  {result.isCorrect ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <CircleX className="h-5 w-5" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-ink-mute">Question {result.position} · {result.difficulty} · {result.bloomLevel}</span>
                  <span className="mt-1 block text-sm font-bold leading-6 text-[#1a1a1f]">{result.questionText}</span>
                </span>
                <span className="hidden rounded-full bg-[#f4f4f6] px-3 py-1.5 text-xs font-bold text-[#52525b] group-open:hidden sm:block">Review</span>
              </summary>
              <div className="border-t border-[#ececf0] px-5 pb-6 pt-5 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#f4f4f6] p-4">
                    <p className="text-xs font-medium text-ink-mute">Your answer</p>
                    <p className="mt-2 text-sm font-semibold text-[#1a1a1f]">{result.selectedOption ?? 'Not answered'}</p>
                  </div>
                  <div className="rounded-xl bg-[#e8f5ed] p-4">
                    <p className="text-[13px] font-medium text-emerald-700">Correct answer</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-900">{result.correctOption}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-[#f2d9df] bg-[#fffafa] p-4">
                  <p className="text-xs font-medium text-ink-mute">Explanation</p>
                  <p className="mt-2 text-sm leading-6 text-[#52525b]">{result.solution}</p>
                </div>
                {(result.conceptTags.length > 0 || result.commonErrors.length > 0) && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {result.conceptTags.length > 0 && <div><p className="text-xs font-medium text-ink-mute">Concepts</p><div className="mt-2 flex flex-wrap gap-2">{result.conceptTags.map((tag) => <span key={tag} className="rounded-full bg-[#f4f4f6] px-2.5 py-1 text-xs font-semibold text-[#52525b]">{tag}</span>)}</div></div>}
                    {result.commonErrors.length > 0 && <div><p className="text-xs font-medium text-ink-mute">Common traps</p><ul className="mt-2 space-y-1 text-sm leading-5 text-[#52525b]">{result.commonErrors.map((item) => <li key={item}>• {item}</li>)}</ul></div>}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
