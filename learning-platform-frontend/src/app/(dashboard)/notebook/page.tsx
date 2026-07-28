'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Brain,
  NotebookTabs,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import PageHero from '@/components/product/PageHero';
import { ApiError, apiFetch } from '@/lib/api';
import type {
  NotebookMistakeCard,
  NotebookMistakesResponse,
} from '@/lib/notebook-types';

function practiceHref(card: NotebookMistakeCard) {
  const params = new URLSearchParams({
    subject: card.practiceSimilar.subject,
    chapter: card.practiceSimilar.chapter,
    topic: card.practiceSimilar.topic,
  });
  return `/practice?${params.toString()}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

function NotebookSkeleton() {
  return (
    <div className="mt-9 grid gap-4 lg:grid-cols-[0.74fr_0.26fr]">
      <section className="rounded-[1.65rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
        <div className="h-5 w-40 animate-pulse rounded-full bg-ink/10" />
        <div className="mt-6 grid gap-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-hairline bg-canvas p-5"
            >
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-ink/10" />
              <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-ink/8" />
              <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full bg-ink/8" />
            </div>
          ))}
        </div>
      </section>
      <aside className="rounded-[1.65rem] bg-ink p-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/15" />
        <div className="mt-5 h-16 animate-pulse rounded-2xl bg-white/10" />
      </aside>
    </div>
  );
}

function EmptyNotebook() {
  return (
    <div className="mt-9 rounded-[1.65rem] border border-hairline bg-surface p-6 text-center shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-10">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-tint text-primary">
        <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-heading text-2xl font-semibold text-ink">
        No mistake cards yet
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
        Once you submit practice or answer adaptive learning questions, your wrong
        answers will appear here with the concept gap, worked solution, and a
        direct action to practice similar questions.
      </p>
      <div className="mt-6 flex justify-center">
        <Link
          href="/practice"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          Start practice
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function MistakeCard({ card }: { card: NotebookMistakeCard }) {
  return (
    <article className="rounded-2xl border border-hairline bg-canvas p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_38px_rgba(20,20,30,0.08)]">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
        <span className="rounded-full bg-primary-tint px-3 py-1 text-primary">
          {card.source === 'ADAPTIVE' ? 'Learn' : 'Practice'}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-ink-mute">
          {card.bloomLevel} · {card.difficulty}
        </span>
        <span className="ml-auto text-ink-mute">{formatDate(card.occurredAt)}</span>
      </div>
      <p className="mt-3 text-xs font-semibold text-ink-mute">
        {card.reviewState === 'DUE' ? 'Due for review' : 'Review due'} ·{' '}
        {formatDate(card.dueReviewAt)}
      </p>

      <h3 className="mt-4 text-base font-semibold leading-6 text-ink">
        {card.questionText}
      </h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-200/60 bg-rose-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-500">
            Your answer
          </p>
          <p className="mt-1 text-sm font-semibold text-rose-800">
            {card.selectedOption ?? 'Not answered'}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
            Correct answer
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-800">
            {card.correctOption}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-hairline bg-white p-4">
        <div className="flex items-start gap-3">
          <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">
              Misconception to repair
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-soft">{card.misconception}</p>
          </div>
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-hairline bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          View worked solution
        </summary>
        <p className="mt-3 text-sm leading-6 text-ink-soft">{card.solution}</p>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {card.conceptTags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-hairline bg-white px-3 py-1 text-xs font-semibold text-ink-soft"
          >
            {tag}
          </span>
        ))}
        <Link
          href={practiceHref(card)}
          className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          Practice similar
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default function NotebookPage() {
  const [notebook, setNotebook] = useState<NotebookMistakesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadNotebook() {
      setLoading(true);
      setError(null);
      try {
        const data =
          await apiFetch<NotebookMistakesResponse>('/api/notebook/mistakes');
        if (!cancelled) setNotebook(data);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Unable to load the notebook right now.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotebook();

    return () => {
      cancelled = true;
    };
  }, []);

  const topTopic = useMemo(() => notebook?.summary.weakTopics[0], [notebook]);

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16 lg:px-10">
        <PageHero
          eyebrow="Mistake notebook"
          title="Every wrong answer becomes a repair card."
          description="The notebook is built from your real submitted answers. It shows what went wrong, why the correct answer works, and where to practice next."
          action={
            <Link
              href="/practice"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Practice weak topics
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        {loading ? <NotebookSkeleton /> : null}

        {!loading && error ? (
          <div className="mt-9 rounded-[1.65rem] border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Notebook could not load</h2>
                <p className="mt-1 text-sm leading-6">{error}</p>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && !error && notebook?.cards.length === 0 ? <EmptyNotebook /> : null}

        {!loading && !error && notebook && notebook.cards.length > 0 ? (
          <div className="mt-9 grid gap-4 lg:grid-cols-[0.72fr_0.28fr]">
            <section className="rounded-[1.65rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
                    Auto saved from database
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold text-ink">
                    Mistakes to repair before the next test
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-primary-tint px-4 py-2 text-sm font-bold text-primary">
                  <NotebookTabs className="h-4 w-4" aria-hidden="true" />
                  {notebook.total} cards
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {notebook.cards.map((card) => (
                  <MistakeCard key={card.id} card={card} />
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-[1.65rem] bg-ink p-6 text-white shadow-[0_14px_34px_rgba(20,20,30,0.12)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                      Repair focus
                    </p>
                    <h2 className="mt-1 font-heading text-xl font-semibold">
                      {topTopic ?? 'Build evidence'}
                    </h2>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-2xl font-semibold">
                      {notebook.summary.practiceMistakes}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                      Practice
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-2xl font-semibold">
                      {notebook.summary.adaptiveMistakes}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                      Learn
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
                  Weak topic queue
                </p>
                <div className="mt-4 space-y-3">
                  {notebook.summary.weakTopics.map((topic) => (
                    <div
                      key={topic}
                      className="rounded-2xl border border-hairline bg-canvas px-4 py-3 text-sm font-semibold text-ink-soft"
                    >
                      {topic}
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
