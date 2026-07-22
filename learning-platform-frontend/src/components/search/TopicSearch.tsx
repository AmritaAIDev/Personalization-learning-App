'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  CircleAlert,
  LoaderCircle,
  Search,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { learningUrl } from '@/lib/learning';
import type { LearningScope } from '@/lib/learning-types';
import type { QuestionCatalogEntry } from '@/lib/practice-types';

function toLearningScope(entry: QuestionCatalogEntry): LearningScope {
  return {
    subject: entry.subject,
    chapter: entry.chapter,
    topic: entry.topic,
  };
}

export default function TopicSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuestionCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const loadCatalog = useCallback(async (value: string) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '6' });
    if (value.trim()) {
      params.set('query', value.trim());
    }
    try {
      const data = await apiFetch<QuestionCatalogEntry[]>(
        '/api/questions/catalog?' + params.toString(),
      );
      setResults(data);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The question catalog could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!opened) return;
    const timeout = window.setTimeout(() => {
      void loadCatalog(query);
    }, query.trim() ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [loadCatalog, opened, query]);

  const startFirstMatch = () => {
    const firstMatch = results[0];
    if (firstMatch) {
      router.push(learningUrl(toLearningScope(firstMatch)));
      setOpened(false);
    }
  };

  return (
    <section className="relative mx-auto w-full max-w-3xl">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,rgba(227,21,64,0.13),transparent_66%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-[#e7dfe1] bg-white/90 p-4 shadow-[0_24px_60px_rgba(49,51,55,0.10)] ring-1 ring-white/80 backdrop-blur-xl transition-all duration-300 ease-out sm:p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            startFirstMatch();
          }}
        >
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search the question bank</span>
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8f939b]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpened(true);
              }}
              onFocus={() => setOpened(true)}
              placeholder="Search a concept, chapter, or practice unit"
              className="h-14 w-full rounded-2xl border border-[#e6e1e2] bg-[#fbfafb] py-3 pl-14 pr-4 text-sm font-medium text-[#313337] outline-none transition placeholder:text-[#a1a5ab] focus:border-[#e31540] focus:bg-white focus:ring-4 focus:ring-[#e31540]/10"
            />
          </label>
          <button
            type="submit"
            disabled={results.length === 0}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#e31540] px-6 text-sm font-bold text-white shadow-[0_12px_24px_rgba(227,21,64,0.22)] transition hover:-translate-y-px hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start journey
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        {opened ? (
        <div className="mt-4 animate-in fade-in slide-in-from-top-1 border-t border-[#eee9ea] pt-4 duration-200">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8f939b]">
              {query.trim() ? 'Matched learning units' : 'Suggested topics'}
            </p>
            {loading && (
              <span className="flex items-center gap-2 text-xs font-medium text-[#8f939b]">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Searching
              </span>
            )}
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">
              <CircleAlert className="h-4 w-4" aria-hidden="true" />
              {error}
            </p>
          )}

          {loading && results.length === 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="min-h-24 rounded-2xl border border-[#ebe4e6] bg-white px-4 py-3"
                >
                  <div className="h-4 w-32 animate-pulse rounded-full bg-[#eee8ea]" />
                  <div className="mt-3 h-3 w-44 animate-pulse rounded-full bg-[#f3eef0]" />
                  <div className="mt-4 flex gap-1.5">
                    <div className="h-5 w-14 animate-pulse rounded-full bg-[#f4f5f7]" />
                    <div className="h-5 w-16 animate-pulse rounded-full bg-[#f4f5f7]" />
                    <div className="h-5 w-14 animate-pulse rounded-full bg-[#f4f5f7]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <p className="rounded-xl bg-[#f7f4f5] px-4 py-5 text-sm text-[#6b6e75]">
              No matching topic yet.
            </p>
          )}

          {!loading && results.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {results.map((entry) => (
                <button
                  key={[entry.subject, entry.chapter, entry.topic].join('-')}
                  type="button"
                  onClick={() => {
                    setOpened(false);
                    router.push(learningUrl(toLearningScope(entry)));
                  }}
                  className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-[#ebe4e6] bg-white px-4 py-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#e31540]/40 hover:bg-[#fff9fa] hover:shadow-[0_10px_24px_rgba(49,51,55,0.07)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#313337]">
                      {entry.topic}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[#8f939b]">
                      {entry.chapter}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                      <span className="rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[#6b6e75]">
                        Easy {entry.easyCount}
                      </span>
                      <span className="rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[#6b6e75]">
                        Medium {entry.mediumCount}
                      </span>
                      <span className="rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[#6b6e75]">
                        Hard {entry.hardCount}
                      </span>
                    </span>
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f9e5ea] text-[#e31540] transition group-hover:bg-[#e31540] group-hover:text-white">
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        ) : null}
      </div>
    </section>
  );
}
