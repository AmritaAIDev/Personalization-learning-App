'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCheck,
  CircleAlert,
  Keyboard,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  appendFlashcards,
  createFlashcardSession,
  currentFlashcard,
  excludedPrompts,
  FLASHCARD_BATCH_SIZE,
  isPersistedFlashcard,
  rateFlashcard,
  remainingFlashcards,
  shouldPrefetchFlashcards,
  type FlashcardSession,
} from '@/lib/flashcard-session';
import type {
  Flashcard,
  FlashcardRating,
  LearningScope,
} from '@/lib/learning-types';
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock';
import StudyMarkdown from './StudyMarkdown';

const RATINGS: Array<{
  value: FlashcardRating;
  label: string;
  caption: string;
  shortcut: string;
  className: string;
}> = [
  {
    value: 'AGAIN',
    label: 'Again',
    caption: 'Show soon',
    shortcut: '1',
    className: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  },
  {
    value: 'HARD',
    label: 'Hard',
    caption: 'Shaky',
    shortcut: '2',
    className: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
  },
  {
    value: 'GOOD',
    label: 'Good',
    caption: 'Recalled',
    shortcut: '3',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  },
  {
    value: 'EASY',
    label: 'Easy',
    caption: 'Instant',
    shortcut: '4',
    className: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
  },
];

type DeckStatus = 'loading' | 'ready' | 'error';

/** What the deck body should render, derived rather than tracked separately. */
type DeckView = 'loading' | 'card' | 'error' | 'summary';

/**
 * Recall workspace for a topic.
 *
 * The deck never blocks on generation after the first batch: it keeps a small
 * buffer ahead of the learner and tops it up in the background, so rating a
 * card always advances instantly. Ratings are persisted against the real card
 * identifier, which is what drives the spaced-repetition schedule server-side.
 */
export default function FlashcardDeck({
  scope,
  onClose,
}: {
  scope: LearningScope;
  onClose: () => void;
}) {
  const [session, setSession] = useState<FlashcardSession>(
    createFlashcardSession,
  );
  const [status, setStatus] = useState<DeckStatus>('loading');
  const [flipped, setFlipped] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [shortcutsVisible, setShortcutsVisible] = useState(false);

  const fetchingRef = useRef(false);
  const sessionRef = useRef(session);
  const startedRef = useRef(false);
  /** Set when the topic has no unseen card left, so prefetch stops retrying. */
  const sourceDryRef = useRef(false);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const { subject, chapter, topic } = scope;

  const card = currentFlashcard(session);
  const remaining = remainingFlashcards(session);

  /**
   * Single writer for the session. Keeping the ref in step with state lets the
   * fetch and keyboard paths read the queue without stale-closure bugs.
   */
  const applySession = useCallback(
    (update: (current: FlashcardSession) => FlashcardSession) => {
      const next = update(sessionRef.current);
      sessionRef.current = next;
      setSession(next);
      return next;
    },
    [],
  );

  const requestBatch = useCallback(async (): Promise<Flashcard[]> => {
    return apiFetch<Flashcard[]>('/api/learning/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify({
        subject,
        chapter,
        topic,
        count: FLASHCARD_BATCH_SIZE,
        // Kept in browser memory for this run only, so a batch never repeats a
        // prompt the learner has just worked through.
        excludedPrompts: excludedPrompts(sessionRef.current),
      }),
    });
  }, [chapter, subject, topic]);

  /**
   * Loads one batch. Nothing is written to state before the request starts, so
   * an automatic top-up costs exactly one render when the cards arrive.
   * `background` keeps a shortfall quiet until the queue actually runs dry.
   */
  const loadBatch = useCallback(
    (mode: 'background' | 'foreground'): Promise<void> => {
      if (fetchingRef.current) return Promise.resolve();
      fetchingRef.current = true;

      return requestBatch()
        .then((batch) => {
          const before = sessionRef.current.queue.length;
          const next = applySession((current) =>
            appendFlashcards(current, batch),
          );
          sourceDryRef.current = next.queue.length === before;

          if (!sourceDryRef.current) setError(null);
          // An empty batch is not a failure: the topic simply has nothing new
          // left, which the summary view reports calmly.
          setStatus('ready');
        })
        .catch((reason: unknown) => {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Flashcards are unavailable right now.',
          );
          // A failed top-up only becomes an error screen once the learner has
          // actually run out of cards; otherwise they keep reviewing undisturbed.
          if (
            mode === 'foreground' ||
            remainingFlashcards(sessionRef.current) === 0
          ) {
            setStatus('error');
          }
        })
        .finally(() => {
          fetchingRef.current = false;
        });
    },
    [applySession, requestBatch],
  );

  /** Explicit retry or "keep reviewing" from the summary. */
  const loadMore = useCallback(() => {
    setError(null);
    setLoadingMore(true);
    sourceDryRef.current = false;
    void loadBatch('foreground').finally(() => setLoadingMore(false));
  }, [loadBatch]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void loadBatch('foreground');
  }, [loadBatch]);

  // Keep a small buffer ahead of the learner so a rating never waits on the API.
  useEffect(() => {
    if (status !== 'ready' || fetchingRef.current || sourceDryRef.current) return;
    if (!shouldPrefetchFlashcards(session)) return;
    void loadBatch('background');
  }, [loadBatch, session, status]);

  const view: DeckView = card
    ? 'card'
    : status === 'loading'
      ? 'loading'
      : status === 'error'
        ? 'error'
        : 'summary';

  const submitRating = useCallback(
    (rating: FlashcardRating) => {
      const active = currentFlashcard(sessionRef.current);
      if (!active) return;

      // Optimistic by design: the schedule write is not on the critical path of
      // the next card.
      if (isPersistedFlashcard(active)) {
        void apiFetch(`/api/learning/flashcards/${active.id}/review`, {
          method: 'POST',
          body: JSON.stringify({ rating }),
        }).catch(() => undefined);
      }
      applySession((current) => rateFlashcard(current, rating));
      setFlipped(false);
      setHintVisible(false);
    },
    [applySession],
  );

  const flip = useCallback(() => setFlipped((value) => !value), []);

  useBodyScrollLock();

  useEffect(() => {
    surfaceRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target?.closest?.('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }
      if (!currentFlashcard(sessionRef.current)) return;

      if (event.key === ' ' || event.key === 'Enter') {
        // A focused control activates itself on these keys; acting here too
        // would flip the card a second time.
        if (target?.closest?.('button, a, [role="button"]')) return;
        event.preventDefault();
        flip();
        return;
      }
      if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        setHintVisible((value) => !value);
        return;
      }
      const rating = RATINGS.find((item) => item.shortcut === event.key);
      if (rating && flipped) {
        event.preventDefault();
        submitRating(rating.value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flip, flipped, onClose, submitRating]);

  const summary = useMemo(
    () =>
      RATINGS.map((rating) => ({
        ...rating,
        count: session.tally[rating.value],
      })),
    [session.tally],
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-stretch bg-[#102017]/55 p-0 backdrop-blur-md sm:items-center sm:justify-center sm:p-6"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Flashcards for ${topic}`}
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f7faf8] shadow-2xl sm:h-[min(48rem,calc(100dvh-3rem))] sm:max-w-4xl sm:rounded-[2rem]"
      >
        <header className="border-b border-primary/10 bg-white px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-7 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Recall space
              </p>
              <h2 className="mt-1 truncate font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {topic}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setShortcutsVisible((value) => !value)}
                aria-expanded={shortcutsVisible}
                className="hidden h-10 w-10 place-items-center rounded-full border border-hairline bg-canvas text-ink-soft transition hover:bg-white hover:text-ink sm:grid"
                aria-label="Keyboard shortcuts"
              >
                <Keyboard className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full border border-hairline bg-canvas text-ink-soft transition hover:bg-white hover:text-ink"
                aria-label="Close flashcards"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-ink-mute">
            <span aria-live="polite">
              {session.reviewed} reviewed
              {remaining > 0 ? ` · ${remaining} in queue` : ''}
            </span>
            {loadingMore ? (
              <span className="flex items-center gap-1.5 text-primary">
                <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden="true" />
                Preparing more cards
              </span>
            ) : null}
          </div>
          {shortcutsVisible ? (
            <p className="mt-2 hidden text-[11px] leading-5 text-ink-mute sm:block">
              <kbd className="font-bold text-ink-soft">Space</kbd> flip ·{' '}
              <kbd className="font-bold text-ink-soft">H</kbd> hint ·{' '}
              <kbd className="font-bold text-ink-soft">1–4</kbd> rate ·{' '}
              <kbd className="font-bold text-ink-soft">Esc</kbd> close
            </p>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 flex-col p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-7">
          {view === 'loading' ? <DeckSkeleton /> : null}

          {view === 'error' ? (
            <div
              className="mx-auto my-auto max-w-md rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-800"
              role="alert"
            >
              <p className="flex items-start gap-2 font-semibold">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error ?? 'Flashcards are unavailable right now.'}
              </p>
              <button
                type="button"
                onClick={loadMore}
                className="mt-4 font-bold underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          ) : null}

          {view === 'summary' ? (
            <RunSummary
              reviewed={session.reviewed}
              summary={summary}
              loadingMore={loadingMore}
              onContinue={loadMore}
              onClose={onClose}
            />
          ) : null}

          {view === 'card' && card ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-ink-mute">
                <span>
                  {flipped
                    ? 'Rate how the recall felt'
                    : 'Recall the answer, then reveal it'}
                </span>
                {card.review ? (
                  <span className="rounded-full bg-primary-tint px-2.5 py-1 text-primary">
                    Seen {card.review.repetitions}×
                  </span>
                ) : (
                  <span className="rounded-full bg-canvas px-2.5 py-1">New card</span>
                )}
              </div>

              <div className="flip-card min-h-0 flex-1">
                <div
                  ref={surfaceRef}
                  role="button"
                  tabIndex={0}
                  aria-pressed={flipped}
                  aria-label={flipped ? 'Hide the answer' : 'Reveal the answer'}
                  onClick={flip}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    flip();
                  }}
                  className={`flip-inner block h-full w-full cursor-pointer text-left ${
                    flipped ? 'is-flipped' : ''
                  }`}
                >
                  <div className="flip-face flex flex-col overflow-y-auto overscroll-contain rounded-[1.75rem] border border-[#e7ebe8] bg-white p-6 shadow-[0_20px_60px_rgba(20,20,30,0.08)] sm:p-9">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute">
                      Prompt
                    </span>
                    <div className="my-auto py-6 text-xl font-semibold leading-8 text-ink sm:text-2xl sm:leading-10">
                      <StudyMarkdown>{card.front}</StudyMarkdown>
                    </div>
                    {card.hint && hintVisible ? (
                      <div className="mb-3 flex items-start gap-2 rounded-2xl bg-primary-tint/70 p-3 text-xs leading-5 text-ink-soft">
                        <Lightbulb
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <StudyMarkdown>{card.hint}</StudyMarkdown>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold text-primary">
                        Tap anywhere to reveal
                      </span>
                      {card.hint && !hintVisible ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setHintVisible(true);
                          }}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-hairline px-3 text-xs font-bold text-ink-soft transition hover:border-primary/40 hover:text-primary"
                        >
                          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                          Need a nudge
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="flip-face flip-face--back flex flex-col overflow-y-auto overscroll-contain rounded-[1.75rem] border border-[#d6e8dc] bg-[#eff8f2] p-6 shadow-[0_20px_60px_rgba(20,20,30,0.08)] sm:p-9">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                      Answer
                    </span>
                    <div className="my-auto py-6 text-[15px] leading-7 text-ink sm:text-base sm:leading-8">
                      <StudyMarkdown>{card.back}</StudyMarkdown>
                    </div>
                    {card.hint ? (
                      <div className="flex items-start gap-2 border-t border-primary/15 pt-4 text-xs leading-5 text-ink-soft">
                        <Lightbulb
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <StudyMarkdown>{card.hint}</StudyMarkdown>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {flipped ? (
                <div
                  className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
                  aria-label="Rate flashcard recall"
                >
                  {RATINGS.map((rating) => (
                    <button
                      key={rating.value}
                      type="button"
                      onClick={() => submitRating(rating.value)}
                      className={`min-h-12 rounded-xl border px-3 py-2 text-xs font-bold transition ${rating.className}`}
                    >
                      <span className="block">{rating.label}</span>
                      <span className="mt-0.5 block text-[10px] font-semibold opacity-70">
                        {rating.caption}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={flip}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white transition hover:bg-ink/90"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reveal answer
                </button>
              )}
            </>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function DeckSkeleton() {
  return (
    <div
      className="mx-auto my-auto w-full max-w-2xl rounded-[1.75rem] border border-[#e7ebe8] bg-white p-6 shadow-[0_20px_60px_rgba(20,20,30,0.08)] sm:p-9"
      aria-label="Loading flashcard"
    >
      <div className="h-3 w-20 rounded-full skeleton" />
      <div className="mt-9 h-7 w-4/5 rounded-full skeleton" />
      <div className="mt-4 h-7 w-3/5 rounded-full skeleton" />
      <div className="mt-16 h-10 w-40 rounded-xl skeleton" />
    </div>
  );
}

function RunSummary({
  reviewed,
  summary,
  loadingMore,
  onContinue,
  onClose,
}: {
  reviewed: number;
  summary: Array<{ value: FlashcardRating; label: string; count: number }>;
  loadingMore: boolean;
  onContinue: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto my-auto w-full max-w-xl rounded-[1.75rem] border border-[#e7ebe8] bg-white p-6 text-center shadow-[0_20px_60px_rgba(20,20,30,0.08)] sm:p-9">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-tint text-primary">
        <CheckCheck className="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-heading text-2xl font-bold tracking-tight text-ink">
        {reviewed > 0 ? 'Recall run complete' : 'No cards to review'}
      </h3>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        {reviewed > 0
          ? `You worked through ${reviewed} card${reviewed === 1 ? '' : 's'}. Ratings are saved, so due cards return on schedule.`
          : 'This topic has no fresh recall prompt right now. Try again after a practice round adds new material.'}
      </p>

      {reviewed > 0 ? (
        <dl className="mt-6 grid grid-cols-4 gap-2 text-center">
          {summary.map((item) => (
            <div key={item.value} className="rounded-2xl bg-canvas px-2 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                {item.label}
              </dt>
              <dd className="mt-1 font-heading text-xl font-bold text-ink">
                {item.count}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onContinue}
          disabled={loadingMore}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingMore ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Keep reviewing
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-hairline px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-canvas"
        >
          Back to practice
        </button>
      </div>
    </div>
  );
}
