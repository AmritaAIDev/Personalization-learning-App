'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CircleAlert, History, LoaderCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { learningUrl } from '@/lib/learning';
import type { LearningDashboardPayload } from '@/lib/learning-types';

export default function LearningHistoryPanel() {
  const [data, setData] = useState<LearningDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await apiFetch<LearningDashboardPayload>('/api/learning/dashboard');
      setData(next);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Learning history could not be loaded.',
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
    <section className="mt-9">
      <div className="flex items-center gap-2 border-b border-[#ececf0] pb-5 text-[#3f6f57]">
        <History className="h-4 w-4" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold">Adaptive history</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-[#1a1a1f]">
            Saved topic progress
          </h2>
        </div>
      </div>
      {loading ? (
        <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#52525b]">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#3f6f57]" aria-hidden="true" />
          Loading saved routes
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-5 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          role="alert"
        >
          <CircleAlert className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      {!loading && !error && data ? (
        <div className="mt-5 grid gap-3">
          {data.history.length === 0 && data.completedTopics.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#dedee3] bg-white p-6 text-sm leading-6 text-[#52525b]">
              No adaptive checkpoint has been completed yet. Start a topic
              workspace from the dashboard to create one.
            </p>
          ) : (
            <>
              {data.history.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={learningUrl(
                    {
                      subject: item.subject,
                      chapter: item.chapter,
                      topic: item.topic,
                    },
                    { tab: 'overview' },
                  )}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-[0_8px_22px_rgba(20, 20, 30,0.04)] transition hover:border-[#3f6f57]/40"
                >
                  <span>
                    <span className="block text-sm font-bold text-[#1a1a1f]">
                      {item.topic}
                    </span>
                    <span className="mt-1 block text-xs text-[#52525b]">
                      {item.coordinate.label} ·{' '}
                      {item.transition.toLowerCase().replace('_', ' ')}
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-[#3f6f57] transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
              {data.completedTopics.map((topic) => (
                <Link
                  key={topic.id}
                  href={learningUrl(topic, { tab: 'overview' })}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition hover:bg-emerald-100"
                >
                  <span>
                    <span className="block text-sm font-bold text-emerald-900">
                      {topic.topic}
                    </span>
                    <span className="mt-1 block text-xs text-emerald-700">
                      Mastered topic with saved progress history
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-emerald-700 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
