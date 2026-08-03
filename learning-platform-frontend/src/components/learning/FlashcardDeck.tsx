'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, Lightbulb, LoaderCircle, RotateCcw, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { apiFetch } from '@/lib/api';
import type { Flashcard, LearningScope } from '@/lib/learning-types';

const DELIVERY_BATCH_SIZE = 5;
const PREFETCH_AT_CARD_INDEX = 3;

const ratingStyles = {
  AGAIN: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  HARD: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
  GOOD: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  EASY: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
} as const;

function cardKey(card: Flashcard) {
  return `${card.front.trim().toLowerCase()}|${card.back.trim().toLowerCase()}`;
}

function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="flashcard-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default function FlashcardDeck({
  scope,
  onClose,
}: {
  scope: LearningScope;
  onClose: () => void;
}) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [nextCards, setNextCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [prefetching, setPrefetching] = useState(false);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [rating, setRating] = useState<keyof typeof ratingStyles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seenCardsRef = useRef(new Set<string>());
  const seenPromptsRef = useRef<string[]>([]);
  const { subject, chapter, topic } = scope;

  const requestBatch = useCallback(async () => {
    const data = await apiFetch<Flashcard[]>('/api/learning/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify({
        subject,
        chapter,
        topic,
        count: DELIVERY_BATCH_SIZE,
        // Kept only in browser memory. The model avoids semantic overlap with
        // recently shown prompts; exact duplicates are rejected for this run.
        excludedPrompts: seenPromptsRef.current.slice(-48),
      }),
    });

    return data.filter((card) => {
      const key = cardKey(card);
      if (seenCardsRef.current.has(key)) return false;
      seenCardsRef.current.add(key);
      seenPromptsRef.current.push(card.front.trim().slice(0, 240));
      return true;
    });
  }, [chapter, subject, topic]);

  const begin = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const batch = await requestBatch();
      if (batch.length === 0) throw new Error('A distinct recall prompt could not be prepared.');
      setCards(batch);
      setIndex(0);
      setFlipped(false);
    } catch {
      setError('Flashcards are temporarily unavailable. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [requestBatch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void begin(), 0);
    return () => window.clearTimeout(timeout);
  }, [begin]);

  const card = cards[index] ?? null;

  useEffect(() => {
    if (
      !card ||
      index < PREFETCH_AT_CARD_INDEX ||
      nextCards.length > 0 ||
      prefetching ||
      generating
    ) return;

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setPrefetching(true);
      void requestBatch()
        .then((batch) => {
          if (!cancelled && batch.length > 0) setNextCards(batch);
        })
        .catch(() => {
          if (!cancelled) {
            setError('Your next flashcard could not be loaded. Please try again.');
          }
        })
        .finally(() => {
          if (!cancelled) setPrefetching(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [card, generating, index, nextCards.length, prefetching, requestBatch]);

  useEffect(() => {
    if (!awaitingNext || nextCards.length === 0) return;
    const timeout = window.setTimeout(() => {
      setCards(nextCards);
      setNextCards([]);
      setIndex(0);
      setFlipped(false);
      setAwaitingNext(false);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [awaitingNext, nextCards]);

  const review = (nextRating: keyof typeof ratingStyles) => {
    if (!card || rating || awaitingNext) return;
    setRating(nextRating);
    window.setTimeout(() => {
      const isLastCard = index === cards.length - 1;
      if (!isLastCard) {
        setIndex((current) => current + 1);
      } else if (nextCards.length > 0) {
        setCards(nextCards);
        setNextCards([]);
        setIndex(0);
      } else {
        // The student stays on a calm transition state only if generation is
        // still in flight; no manual "next set" action is ever required.
        setAwaitingNext(true);
      }
      setFlipped(false);
      setRating(null);
    }, 180);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-stretch bg-[#102017]/55 p-0 backdrop-blur-md sm:items-center sm:justify-center sm:p-6" role="presentation">
      <section role="dialog" aria-modal="true" aria-label={`Flashcards for ${topic}`} className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f7faf8] shadow-2xl sm:h-[min(48rem,calc(100dvh-3rem))] sm:max-w-4xl sm:rounded-[2rem]">
        <header className="flex items-center justify-between gap-4 border-b border-primary/10 bg-white px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-7 sm:py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Recall space</p>
            <h2 className="mt-1 truncate font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">{topic}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hairline bg-canvas text-ink-soft transition hover:bg-white hover:text-ink" aria-label="Close flashcards"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-7">
          {error ? <div className="mx-auto my-auto max-w-md rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-800" role="alert"><p className="flex items-start gap-2 font-semibold"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}</p><button type="button" onClick={() => void begin()} className="mt-4 font-bold underline underline-offset-4">Try again</button></div> : null}
          {!error && (generating || !card || awaitingNext) ? <div className="mx-auto my-auto w-full max-w-2xl rounded-[1.75rem] border border-[#e7ebe8] bg-white p-6 shadow-[0_20px_60px_rgba(20,20,30,0.08)] sm:p-9" aria-label="Loading flashcard"><div className="h-3 w-20 rounded-full skeleton" /><div className="mt-9 h-7 w-4/5 rounded-full skeleton" /><div className="mt-4 h-7 w-3/5 rounded-full skeleton" /><div className="mt-16 h-10 w-40 rounded-xl skeleton" /></div> : null}
          {!error && card && !awaitingNext ? <>
            <div className="mb-4 text-[11px] font-semibold text-ink-mute">Tap the card to reveal the answer</div>
            <div className="flip-card min-h-0 flex-1">
              <button type="button" onClick={() => setFlipped((value) => !value)} className={`flip-inner block h-full w-full text-left ${flipped ? 'is-flipped' : ''}`} aria-pressed={flipped}>
                <div className="flip-face flex flex-col overflow-y-auto rounded-[1.75rem] border border-[#e7ebe8] bg-white p-6 shadow-[0_20px_60px_rgba(20,20,30,0.08)] sm:p-9"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute">Prompt</span><div className="my-auto py-8 text-xl font-semibold leading-8 text-ink sm:text-2xl sm:leading-10"><MarkdownContent>{card.front}</MarkdownContent></div><span className="text-xs font-semibold text-primary">Tap anywhere to reveal</span></div>
                <div className="flip-face flip-face--back flex flex-col overflow-y-auto rounded-[1.75rem] border border-[#d6e8dc] bg-[#eff8f2] p-6 shadow-[0_20px_60px_rgba(20,20,30,0.08)] sm:p-9"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Answer</span><div className="my-auto py-7 text-[15px] leading-7 text-ink sm:text-base sm:leading-8"><MarkdownContent>{card.back}</MarkdownContent></div>{card.hint ? <div className="flex items-start gap-2 border-t border-primary/15 pt-4 text-xs leading-5 text-ink-soft"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><MarkdownContent>{card.hint}</MarkdownContent></div> : null}</div>
              </button>
            </div>
            {flipped ? <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Rate flashcard recall">{(Object.keys(ratingStyles) as Array<keyof typeof ratingStyles>).map((value) => <button key={value} type="button" onClick={() => review(value)} disabled={rating !== null} className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${ratingStyles[value]}`}>{rating === value ? <LoaderCircle className="mx-auto h-4 w-4 animate-spin" /> : value.charAt(0) + value.slice(1).toLowerCase()}</button>)}</div> : <button type="button" onClick={() => setFlipped(true)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white transition hover:bg-ink/90"><RotateCcw className="h-4 w-4" /> Reveal answer</button>}
          </> : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}
