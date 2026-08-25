import type { Flashcard, FlashcardRating } from "./learning-types";

/** How many cards ahead of the learner the deck tries to keep buffered. */
export const FLASHCARD_PREFETCH_THRESHOLD = 2;

/** Cards requested per delivery batch. */
export const FLASHCARD_BATCH_SIZE = 6;

/**
 * Where an "Again" card is put back into the running queue. Close enough to
 * come round in the same sitting, far enough that it is a real recall test.
 */
const AGAIN_REQUEUE_GAP = 3;

/** Prompt labels kept for de-duplication, bounded so the request stays small. */
const MAX_TRACKED_PROMPTS = 48;

/**
 * A flip slower than this reads as genuine hesitation rather than normal
 * reading time — long enough that a quick glance-and-tap never counts.
 */
export const HESITATION_THRESHOLD_SECONDS = 12;

export type FlashcardTally = Record<FlashcardRating, number>;

export type FlashcardHesitation = {
  front: string;
  tags: string[];
  seconds: number;
};

export type FlashcardSession = {
  /** Cards still to be shown, in order. */
  queue: Flashcard[];
  /** Pointer into `queue`; equal to `queue.length` when the run is caught up. */
  index: number;
  /** Ratings submitted in this run, including repeats of an "Again" card. */
  reviewed: number;
  tally: FlashcardTally;
  /** Normalized prompts already delivered, newest last. */
  seenPrompts: string[];
  /** Cards where reveal took unusually long, for the end-of-run focus note. */
  hesitations: FlashcardHesitation[];
};

export function createFlashcardSession(): FlashcardSession {
  return {
    queue: [],
    index: 0,
    reviewed: 0,
    tally: { AGAIN: 0, HARD: 0, GOOD: 0, EASY: 0 },
    seenPrompts: [],
    hesitations: [],
  };
}

/**
 * Records how long a card sat unrevealed before the learner tapped to flip
 * it. This is a secondary signal only — it never touches the self-rated
 * Again/Hard/Good/Easy tally that actually drives the spaced-repetition
 * schedule; it just feeds the end-of-run "you hesitated on" note.
 */
export function recordHesitation(
  session: FlashcardSession,
  card: Flashcard,
  seconds: number,
): FlashcardSession {
  if (seconds < HESITATION_THRESHOLD_SECONDS) return session;
  return {
    ...session,
    hesitations: [
      ...session.hesitations,
      { front: card.front, tags: card.tags, seconds },
    ],
  };
}

/** Stable identity for a card, resilient to the same prompt arriving twice. */
export function flashcardKey(card: Flashcard): string {
  return normalizePrompt(card.front);
}

export function normalizePrompt(value: string): string {
  return value
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 240);
}

export function currentFlashcard(session: FlashcardSession): Flashcard | null {
  return session.queue[session.index] ?? null;
}

/** Cards left to show, including the one on screen. */
export function remainingFlashcards(session: FlashcardSession): number {
  return Math.max(0, session.queue.length - session.index);
}

/** True when the buffer has run low enough to fetch the next batch. */
export function shouldPrefetchFlashcards(session: FlashcardSession): boolean {
  return remainingFlashcards(session) <= FLASHCARD_PREFETCH_THRESHOLD;
}

/**
 * Appends a delivered batch, dropping any card this run has already shown.
 * Returns the same session object when nothing new arrived so callers can skip
 * a re-render.
 */
export function appendFlashcards(
  session: FlashcardSession,
  cards: Flashcard[],
): FlashcardSession {
  const known = new Set(session.seenPrompts);
  const fresh: Flashcard[] = [];
  for (const card of cards) {
    const key = flashcardKey(card);
    if (!key || known.has(key)) continue;
    known.add(key);
    fresh.push(card);
  }
  if (fresh.length === 0) return session;
  return {
    ...session,
    queue: [...session.queue, ...fresh],
    seenPrompts: [...session.seenPrompts, ...fresh.map(flashcardKey)].slice(
      -MAX_TRACKED_PROMPTS,
    ),
  };
}

/**
 * Applies a recall rating. "Again" keeps the card in this run and brings it
 * back a few cards later; every other rating retires it for the session and
 * lets the server-side schedule decide when it returns.
 */
export function rateFlashcard(
  session: FlashcardSession,
  rating: FlashcardRating,
): FlashcardSession {
  const card = currentFlashcard(session);
  if (!card) return session;

  const tally: FlashcardTally = {
    ...session.tally,
    [rating]: session.tally[rating] + 1,
  };

  if (rating !== "AGAIN") {
    return {
      ...session,
      index: session.index + 1,
      reviewed: session.reviewed + 1,
      tally,
    };
  }

  const rest = [
    ...session.queue.slice(0, session.index),
    ...session.queue.slice(session.index + 1),
  ];
  const reinsertAt = Math.min(rest.length, session.index + AGAIN_REQUEUE_GAP);
  return {
    ...session,
    queue: [...rest.slice(0, reinsertAt), card, ...rest.slice(reinsertAt)],
    reviewed: session.reviewed + 1,
    tally,
  };
}

/** Prompts sent to the server so a new batch avoids repeating this run. */
export function excludedPrompts(session: FlashcardSession): string[] {
  return session.seenPrompts.slice(-MAX_TRACKED_PROMPTS);
}

/** Only persisted cards carry a real identifier that a rating can be saved to. */
export function isPersistedFlashcard(card: Flashcard): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    card.id,
  );
}
