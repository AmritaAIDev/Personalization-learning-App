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

  // Warm the catalog in the background on mount so suggestions are instant
  // the moment the field is focused — no visible fetch lag.
  useEffect(() => {
    const timeout = window.setTimeout(() => void loadCatalog(''), 150);
    return () => window.clearTimeout(timeout);
  }, [loadCatalog]);

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
    <section className="mx-auto w-full">
      <form
        className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          startFirstMatch();
        }}
      >
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search the question bank</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-mute" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpened(true);
            }}
            onFocus={() => setOpened(true)}
            placeholder="Search a concept, chapter, or practice unit"
            className="h-13 w-full rounded-xl border border-hairline bg-surface py-3.5 pl-12 pr-4 text-[15px] text-ink outline-none transition duration-200 placeholder:text-ink-mute focus:border-primary/40"
          />
        </label>
        <button
          type="submit"
          disabled={results.length === 0}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-white transition duration-200 hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start journey
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      {opened ? (
        <div className="mt-4 animate-fade">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-ink-mute">
              {query.trim() ? 'Matched learning units' : 'Suggested topics'}
            </p>
            {loading && (
              <span className="flex items-center gap-2 text-xs font-medium text-ink-mute">
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
            <div className="grid gap-2.5 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="min-h-24 rounded-2xl bg-surface px-4 py-4 hairline">
                  <div className="h-4 w-32 rounded-full skeleton" />
                  <div className="mt-3 h-3 w-44 rounded-full skeleton" />
                  <div className="mt-4 flex gap-1.5">
                    <div className="h-5 w-14 rounded-full skeleton" />
                    <div className="h-5 w-16 rounded-full skeleton" />
                    <div className="h-5 w-14 rounded-full skeleton" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <p className="rounded-xl bg-surface px-4 py-5 text-sm text-ink-soft hairline">
              No matching topic yet.
            </p>
          )}

          {!loading && results.length > 0 && (
            <div className="grid gap-2.5 md:grid-cols-2">
              {results.map((entry) => (
                <button
                  key={[entry.subject, entry.chapter, entry.topic].join('-')}
                  type="button"
                  onClick={() => {
                    setOpened(false);
                    router.push(learningUrl(toLearningScope(entry)));
                  }}
                  className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-4 text-left transition-all duration-200 hairline hover:border-ink/15 hover:shadow-[0_8px_24px_rgba(20,20,30,0.06)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-ink">
                      {entry.topic}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-mute">
                      {entry.chapter}
                    </span>
                    <span className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-medium">
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-ink-soft">
                        Easy {entry.easyCount}
                      </span>
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-ink-soft">
                        Medium {entry.mediumCount}
                      </span>
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-ink-soft">
                        Hard {entry.hardCount}
                      </span>
                    </span>
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-canvas text-ink-soft transition group-hover:bg-ink group-hover:text-white">
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
