import { describe, expect, it } from "vitest";
import {
  appendFlashcards,
  createFlashcardSession,
  currentFlashcard,
  excludedPrompts,
  isPersistedFlashcard,
  rateFlashcard,
  remainingFlashcards,
  shouldPrefetchFlashcards,
  type FlashcardSession,
} from "./flashcard-session";
import type { Flashcard } from "./learning-types";

function card(id: string, front = `Prompt ${id}`): Flashcard {
  return {
    id,
    subject: "Physics",
    chapter: "Electrostatics",
    topic: "Gauss Law",
    front,
    back: `Answer ${id}`,
    hint: null,
    tags: [],
    review: null,
  };
}

function sessionWith(...cards: Flashcard[]): FlashcardSession {
  return appendFlashcards(createFlashcardSession(), cards);
}

describe("flashcard session queue", () => {
  it("appends a batch and shows the first card", () => {
    const session = sessionWith(card("a"), card("b"));
    expect(remainingFlashcards(session)).toBe(2);
    expect(currentFlashcard(session)?.id).toBe("a");
  });

  it("drops prompts already delivered in this run", () => {
    const first = sessionWith(card("a"), card("b"));
    const second = appendFlashcards(first, [
      card("a-duplicate", "Prompt a"),
      card("c"),
    ]);
    expect(second.queue.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("returns the same session when a batch adds nothing", () => {
    const first = sessionWith(card("a"));
    expect(appendFlashcards(first, [card("a-again", "Prompt a")])).toBe(first);
  });

  it("retires a card that was recalled", () => {
    const session = rateFlashcard(sessionWith(card("a"), card("b")), "GOOD");
    expect(currentFlashcard(session)?.id).toBe("b");
    expect(session.reviewed).toBe(1);
    expect(session.tally.GOOD).toBe(1);
  });

  it('brings an "Again" card back later in the same run', () => {
    const session = rateFlashcard(
      sessionWith(card("a"), card("b"), card("c"), card("d"), card("e")),
      "AGAIN",
    );
    expect(currentFlashcard(session)?.id).toBe("b");
    expect(session.queue.map((item) => item.id)).toEqual([
      "b",
      "c",
      "d",
      "a",
      "e",
    ]);
    expect(session.tally.AGAIN).toBe(1);
  });

  it('keeps an "Again" card in the run even when it is the last one', () => {
    const session = rateFlashcard(sessionWith(card("a")), "AGAIN");
    expect(currentFlashcard(session)?.id).toBe("a");
    expect(remainingFlashcards(session)).toBe(1);
  });

  it("ignores a rating when the queue is caught up", () => {
    const empty = createFlashcardSession();
    expect(rateFlashcard(empty, "GOOD")).toBe(empty);
  });

  it("asks for more cards once the buffer runs low", () => {
    const session = sessionWith(card("a"), card("b"), card("c"));
    expect(shouldPrefetchFlashcards(session)).toBe(false);
    expect(shouldPrefetchFlashcards(rateFlashcard(session, "GOOD"))).toBe(true);
  });

  it("reports the prompts a new batch should avoid", () => {
    const session = sessionWith(card("a", "What is Gauss law?"));
    expect(excludedPrompts(session)).toEqual(["what is gauss law"]);
  });
});

describe("flashcard persistence check", () => {
  it("accepts a stored card identifier", () => {
    expect(
      isPersistedFlashcard(card("0f1d1f3c-8a4a-4a5c-9b1e-2f9c8a7b6d5e")),
    ).toBe(true);
  });

  it("rejects a placeholder identifier that cannot carry a review", () => {
    expect(isPersistedFlashcard(card("live-1700000000000-0"))).toBe(false);
  });
});
