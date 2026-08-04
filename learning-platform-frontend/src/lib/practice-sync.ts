export type PracticeAnswerDraft = {
  questionId: string;
  selectedOption: string;
  elapsedSeconds: number;
};

export type PracticeSyncState = {
  /** Answers still waiting to reach the server. */
  pending: number;
  /** True while a save request is in flight. */
  saving: boolean;
  /** Set when the last attempt failed; the answer is retained and retried. */
  failed: boolean;
};

export type PracticeAnswerSaver = (draft: PracticeAnswerDraft) => Promise<void>;

/** Backoff between retries of a failed autosave, in milliseconds. */
const RETRY_DELAYS_MS = [1_000, 2_500, 5_000, 10_000];

export function retryDelayFor(failureCount: number): number {
  return (
    RETRY_DELAYS_MS[Math.min(failureCount, RETRY_DELAYS_MS.length - 1)] ??
    RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]
  );
}

/**
 * Background autosave for practice answers.
 *
 * Selecting an option must feel instantaneous, so the UI updates immediately
 * and the write is drained from this queue. Only the newest answer per question
 * is ever sent — changing a choice while an older save is in flight replaces it
 * rather than queueing a second write — and a failed save is retried with
 * backoff instead of being silently dropped.
 */
export class PracticeAnswerQueue {
  private readonly drafts = new Map<string, PracticeAnswerDraft>();
  private draining = false;
  private failureCount = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(
    private readonly save: PracticeAnswerSaver,
    private readonly onStateChange: (state: PracticeSyncState) => void,
  ) {}

  enqueue(draft: PracticeAnswerDraft): void {
    if (this.stopped) return;
    this.drafts.set(draft.questionId, draft);
    this.emit(false);
    void this.drain();
  }

  /** Answers still unsaved; used to warn before submitting. */
  get pendingCount(): number {
    return this.drafts.size;
  }

  retryNow(): void {
    this.failureCount = 0;
    void this.drain();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private emit(saving: boolean, failed = this.failureCount > 0): void {
    this.onStateChange({ pending: this.drafts.size, saving, failed });
  }

  private async drain(): Promise<void> {
    if (this.draining || this.stopped) return;
    this.draining = true;
    try {
      while (this.drafts.size > 0 && !this.stopped) {
        const [questionId, draft] = this.drafts.entries().next().value as [
          string,
          PracticeAnswerDraft,
        ];
        this.emit(true);
        try {
          await this.save(draft);
          // Only clear when the stored value is still the one just saved; a
          // newer selection made mid-flight stays queued.
          if (this.drafts.get(questionId) === draft) {
            this.drafts.delete(questionId);
          }
          this.failureCount = 0;
          this.emit(false, false);
        } catch {
          this.failureCount += 1;
          this.emit(false, true);
          this.scheduleRetry();
          return;
        }
      }
    } finally {
      this.draining = false;
    }
  }

  private scheduleRetry(): void {
    if (this.timer || this.stopped) return;
    this.timer = setTimeout(
      () => {
        this.timer = null;
        void this.drain();
      },
      retryDelayFor(this.failureCount - 1),
    );
  }
}
