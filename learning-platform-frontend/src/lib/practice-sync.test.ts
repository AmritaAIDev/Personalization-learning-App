import { describe, expect, it, vi } from "vitest";
import {
  PracticeAnswerQueue,
  retryDelayFor,
  type PracticeAnswerDraft,
  type PracticeSyncState,
} from "./practice-sync";

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const draft = (
  questionId: string,
  selectedOption: string,
): PracticeAnswerDraft => ({
  questionId,
  selectedOption,
  elapsedSeconds: 12,
});

describe("practice answer autosave queue", () => {
  it("saves a queued answer and reports an empty queue afterwards", async () => {
    const saved: PracticeAnswerDraft[] = [];
    const states: PracticeSyncState[] = [];
    const queue = new PracticeAnswerQueue(
      async (value) => {
        saved.push(value);
      },
      (state) => states.push(state),
    );

    queue.enqueue(draft("q1", "A"));
    await vi.waitFor(() => expect(queue.pendingCount).toBe(0));

    expect(saved).toEqual([draft("q1", "A")]);
    expect(states.at(-1)).toEqual({ pending: 0, saving: false, failed: false });
  });

  it("keeps only the newest answer for a question changed mid-flight", async () => {
    const firstSave = deferred();
    const saved: string[] = [];
    const queue = new PracticeAnswerQueue(
      async (value) => {
        saved.push(value.selectedOption);
        if (saved.length === 1) await firstSave.promise;
      },
      () => undefined,
    );

    queue.enqueue(draft("q1", "A"));
    await vi.waitFor(() => expect(saved).toHaveLength(1));

    // Two more changes while the first request is still open.
    queue.enqueue(draft("q1", "B"));
    queue.enqueue(draft("q1", "C"));
    firstSave.resolve();

    await vi.waitFor(() => expect(queue.pendingCount).toBe(0));
    expect(saved).toEqual(["A", "C"]);
  });

  it("retains a failed answer and reports it so the learner is warned", async () => {
    const states: PracticeSyncState[] = [];
    const queue = new PracticeAnswerQueue(
      async () => {
        throw new Error("offline");
      },
      (state) => states.push(state),
    );

    queue.enqueue(draft("q1", "A"));
    await vi.waitFor(() =>
      expect(states.some((state) => state.failed)).toBe(true),
    );

    expect(queue.pendingCount).toBe(1);
    queue.stop();
  });

  it("drains every queued question in turn", async () => {
    const saved: string[] = [];
    const queue = new PracticeAnswerQueue(
      async (value) => {
        saved.push(value.questionId);
      },
      () => undefined,
    );

    queue.enqueue(draft("q1", "A"));
    queue.enqueue(draft("q2", "B"));
    queue.enqueue(draft("q3", "C"));

    await vi.waitFor(() => expect(queue.pendingCount).toBe(0));
    expect(saved).toEqual(["q1", "q2", "q3"]);
  });

  it("backs off further with each consecutive failure", () => {
    expect(retryDelayFor(0)).toBeLessThan(retryDelayFor(1));
    expect(retryDelayFor(1)).toBeLessThan(retryDelayFor(3));
    // Clamped, never unbounded.
    expect(retryDelayFor(99)).toBe(retryDelayFor(3));
  });
});
