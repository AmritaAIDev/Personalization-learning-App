'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, Lightbulb, LoaderCircle, RotateCcw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { Flashcard, LearningScope } from '@/lib/learning-types';

const ratingStyles = {
  AGAIN: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  HARD: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
  GOOD: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  EASY: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
} as const;

export default function FlashcardDeck({
  scope,
  active = true,
}: {
  scope: LearningScope;
  /**
   * When false, the deck still fetches any existing cards in the background so
   * the tab is instant when opened, but it will NOT trigger the (expensive) LLM
   * auto-generation until the section is actually viewed.
   */
  active?: boolean;
}) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rating, setRating] = useState<keyof typeof ratingStyles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoGenerateAttemptedRef = useRef(false);
  const { subject, chapter, topic } = scope;

  const query = useMemo(() => new URLSearchParams(scope).toString(), [scope]);
  const generate = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await apiFetch<Flashcard[]>('/api/learning/flashcards/generate', {
        method: 'POST',
        body: JSON.stringify({ subject, chapter, topic, count: 6 }),
      });
      setCards(data);
      setIndex(0);
      setFlipped(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'AI flashcards could not be generated.',
      );
    } finally {
      setGenerating(false);
    }
  }, [chapter, generating, subject, topic]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Flashcard[]>(`/api/learning/flashcards?${query}`);
      setCards(data);
      setIndex(0);
      setFlipped(false);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Flashcards could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    autoGenerateAttemptedRef.current = false;
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    if (!active) return;
    if (loading || generating || error || cards.length > 0) return;
    if (autoGenerateAttemptedRef.current) return;
    autoGenerateAttemptedRef.current = true;
    void generate();
  }, [active, cards.length, error, generate, generating, loading]);

  const card = cards[index] ?? null;
  const review = async (nextRating: keyof typeof ratingStyles) => {
    if (!card || rating) return;
    setRating(nextRating);
    try {
      const updated = await apiFetch<Flashcard>(`/api/learning/flashcards/${card.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating: nextRating }),
      });
      setCards((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setFlipped(false);
      setIndex((current) => (cards.length > 1 ? (current + 1) % cards.length : current));
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'The flashcard review could not be saved.',
      );
    } finally {
      setRating(null);
    }
  };

  return (
    <aside className="mx-auto max-w-2xl rounded-2xl bg-surface p-6 hairline elevate-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Topic flashcards</h2>
        <div className="flex shrink-0 items-center gap-2">
          {!loading && cards.length > 0 && (
            <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-medium text-ink-soft">
              {index + 1}/{cards.length}
            </span>
          )}
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading || generating}
            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-[11px] font-medium text-ink-soft transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-55"
          >
            {generating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
            {cards.length > 0 ? 'Generate more' : 'Generate AI'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-5 space-y-3" aria-label="Loading flashcards">
          <div className="h-48 rounded-2xl skeleton" />
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-10 rounded-xl skeleton" />
            ))}
          </div>
        </div>
      )}
      {error && (
        <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">
          <p className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4" aria-hidden="true" /> {error}
          </p>
          <button type="button" onClick={() => void load()} className="mt-2 underline underline-offset-4">
            Try again
          </button>
        </div>
      )}
      {!loading && !error && !card && (
        <p className="mt-5 rounded-xl bg-canvas p-4 text-sm leading-6 text-ink-soft">
          {generating
            ? 'Preparing grounded flashcards from reviewed material…'
            : 'No published flashcards are available for this topic yet.'}
        </p>
      )}
      {card && (
        <>
          <div className="flip-card mt-5 w-full" style={{ height: '13rem' }}>
            <button
              type="button"
              onClick={() => setFlipped((value) => !value)}
              className={`flip-inner block h-full w-full text-left ${flipped ? 'is-flipped' : ''}`}
              aria-pressed={flipped}
            >
              {/* Front — prompt. */}
              <span className="flip-face flex flex-col overflow-auto rounded-2xl bg-canvas p-6 hairline">
                <span className="text-[11px] font-medium text-ink-mute">Prompt · tap to flip</span>
                <span className="mt-4 font-heading text-lg font-semibold leading-7 text-ink">
                  {card.front}
                </span>
              </span>
              {/* Back — answer. */}
              <span className="flip-face flip-face--back flex flex-col overflow-auto rounded-2xl bg-primary-tint p-6 hairline">
                <span className="text-[11px] font-medium text-primary">Answer · tap to flip</span>
                <span className="mt-4 font-heading text-lg font-semibold leading-7 text-ink">
                  {card.back}
                </span>
                {card.hint && (
                  <span className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink-soft">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {card.hint}
                  </span>
                )}
              </span>
            </button>
          </div>

          {flipped ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Rate flashcard recall">
              {(Object.keys(ratingStyles) as Array<keyof typeof ratingStyles>).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => void review(value)}
                  disabled={rating !== null}
                  className={`min-h-10 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${ratingStyles[value]}`}
                >
                  {rating === value ? (
                    <LoaderCircle className="mx-auto h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    value.charAt(0) + value.slice(1).toLowerCase()
                  )}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink/90"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reveal and rate
            </button>
          )}
        </>
      )}
    </aside>
  );
}
