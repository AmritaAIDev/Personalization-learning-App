'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Compass,
  LoaderCircle,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { learningUrl } from '@/lib/learning';
import type { LearningDashboardPayload } from '@/lib/learning-types';

export default function LearningOverview() {
  const [data, setData] = useState<LearningDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await apiFetch<LearningDashboardPayload>('/api/learning/dashboard');
      setData(next);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Adaptive learning history could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-4 border-b border-[#e8e2e4] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Your adaptive route
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#313337] sm:text-3xl">
            Learning progress
          </h2>
        </div>
        {data?.history[0] ? (
          <span className="text-xs font-semibold text-[#6b6e75]">
            Latest checkpoint: {data.history[0].coordinate.label}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="grid min-h-40 place-items-center text-sm font-semibold text-[#6b6e75]">
          <span className="flex items-center gap-2">
            <LoaderCircle className="h-4 w-4 animate-spin text-[#e31540]" aria-hidden="true" />
            Loading your route
          </span>
        </div>
      ) : null}
      {error ? (
        <div
          className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Route unavailable</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-2 font-bold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}
      {!loading && !error && data ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[1.75rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_12px_28px_rgba(49,51,55,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-lg font-bold text-[#313337]">
                Continue learning
              </h3>
              <span className="text-xs font-bold text-[#6b6e75]">
                {data.activeTopics.length} active
              </span>
            </div>
            {data.activeTopics.length === 0 ? (
              <p className="mt-5 rounded-xl bg-[#f7f4f5] p-4 text-sm leading-6 text-[#6b6e75]">
                No active topics yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.activeTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={learningUrl(topic, { tab: 'overview' })}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-[#ece6e8] p-4 transition hover:border-[#e31540]/40 hover:bg-[#fffafb]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#313337]">
                        {topic.topic}
                      </span>
                      <span className="mt-1 block text-xs text-[#6b6e75]">
                        {topic.stageLabel} · {topic.currentCoordinate.label}
                      </span>
                      <span className="mt-3 block h-1.5 w-36 overflow-hidden rounded-full bg-[#ece7e8]">
                        <span
                          className="block h-full rounded-full bg-[#e31540]"
                          style={{ width: `${topic.masteryPercent}%` }}
                        />
                      </span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-[#e31540] transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-[1.75rem] bg-[#313337] p-5 text-white shadow-[0_16px_34px_rgba(49,51,55,0.15)]">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f7b9c8]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Suggested next topics
            </p>
            {data.suggestions.length === 0 ? (
              <p className="mt-5 text-sm leading-6 text-[#d6d7da]">
                No suggestions yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.suggestions.map((topic) => (
                  <Link
                    key={[topic.subject, topic.chapter, topic.topic].join('-')}
                    href={learningUrl(topic, { tab: 'overview' })}
                    className="group block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block text-sm font-bold">{topic.topic}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#d6d7da]">
                          {topic.reason}
                        </span>
                      </span>
                      <ArrowRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#f7b9c8] transition group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-3 inline-block rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f7b9c8]">
                      {topic.questionCount} reviewed questions
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-[1.75rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_12px_28px_rgba(49,51,55,0.05)] lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-lg font-bold text-[#313337]">
                Completed topics
              </h3>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {data.completedTopics.length} mastered
              </span>
            </div>
            {data.completedTopics.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-[#6b6e75]">
                No mastered topics yet.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.completedTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={learningUrl(topic, { tab: 'overview' })}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    {topic.topic}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
