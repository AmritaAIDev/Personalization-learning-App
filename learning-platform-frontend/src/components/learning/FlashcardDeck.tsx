'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BrainCircuit,
  CircleAlert,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { Flashcard, LearningScope } from '@/lib/learning-types';

const ratingStyles = {
  AGAIN: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  HARD: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
  GOOD: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  EASY: 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100',
} as const;

export default function FlashcardDeck({ scope }: { scope: LearningScope }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<keyof typeof ratingStyles | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => new URLSearchParams(scope).toString(), [scope]);
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
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const card = cards[index] ?? null;
  const review = async (nextRating: keyof typeof ratingStyles) => {
    if (!card || rating) return;
    setRating(nextRating);
    try {
      const updated = await apiFetch<Flashcard>(
        `/api/learning/flashcards/${card.id}/review`,
        { method: 'POST', body: JSON.stringify({ rating: nextRating }) },
      );
      setCards((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setFlipped(false);
      setIndex((current) => (cards.length > 1 ? (current + 1) % cards.length : current));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The flashcard review could not be saved.');
    } finally {
      setRating(null);
    }
  };

  return (
    <aside className="rounded-[1.75rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_14px_34px_rgba(49,51,55,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#e31540]">
            <BrainCircuit className="h-4 w-4" aria-hidden="true" />
            Recall lab
          </p>
          <h2 className="mt-1 font-heading text-lg font-bold text-[#313337]">Topic flashcards</h2>
        </div>
        {!loading && cards.length > 0 && (
          <span className="rounded-full bg-[#f7f4f5] px-2.5 py-1 text-[11px] font-bold text-[#6b6e75]">
            {index + 1}/{cards.length}
          </span>
        )}
      </div>

      {loading && (
        <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#6b6e75]">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#e31540]" aria-hidden="true" />
          Loading flashcards
        </p>
      )}
      {error && (
        <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-700" role="alert">
          <p className="flex items-center gap-2"><CircleAlert className="h-4 w-4" aria-hidden="true" /> {error}</p>
          <button type="button" onClick={() => void load()} className="mt-2 underline underline-offset-4">Try again</button>
        </div>
      )}
      {!loading && !error && !card && (
        <p className="mt-5 rounded-2xl bg-[#f7f4f5] p-4 text-sm leading-6 text-[#6b6e75]">
          No published flashcards are available for this topic yet.
        </p>
      )}
      {card && (
        <>
          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="mt-5 min-h-48 w-full rounded-2xl border border-[#e8e1e3] bg-[linear-gradient(145deg,#fff,#faf5f6)] p-5 text-left transition hover:border-[#e31540]/45 hover:shadow-[0_10px_24px_rgba(49,51,55,0.07)]"
            aria-pressed={flipped}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f939b]">
              {flipped ? 'Answer' : 'Prompt'} · tap to flip
            </span>
            <p className="mt-4 font-heading text-lg font-bold leading-7 text-[#313337]">
              {flipped ? card.back : card.front}
            </p>
            {flipped && card.hint && (
              <span className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#6b6e75]">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#e31540]" aria-hidden="true" />
                {card.hint}
              </span>
            )}
          </button>

          {flipped ? (
            <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Rate flashcard recall">
              {(Object.keys(ratingStyles) as Array<keyof typeof ratingStyles>).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => void review(value)}
                  disabled={rating !== null}
                  className={`min-h-10 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${ratingStyles[value]}`}
                >
                  {rating === value ? <LoaderCircle className="mx-auto h-4 w-4 animate-spin" aria-hidden="true" /> : value.charAt(0) + value.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#e3b4c0] bg-[#fff5f7] px-3 py-2 text-xs font-bold text-[#a61231] transition hover:bg-[#f9e5ea]"
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
