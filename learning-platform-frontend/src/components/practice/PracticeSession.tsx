"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Flag,
  LoaderCircle,
  RefreshCw,
  Send,
  Timer,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import ReportQuestionButton from "@/components/ReportQuestionButton";
import StudyMarkdown from "@/components/learning/StudyMarkdown";
import { formatDuration } from "@/lib/format";
import {
  elapsedPracticeSeconds,
  nextUnansweredIndex,
  summarizePracticeProgress,
  type PracticeScope,
} from "@/lib/practice";
import {
  PracticeAnswerQueue,
  type PracticeSyncState,
} from "@/lib/practice-sync";
import type { PracticeAttemptPayload } from "@/lib/practice-types";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

const IDLE_SYNC: PracticeSyncState = {
  pending: 0,
  saving: false,
  failed: false,
};

/**
 * Exam-style practice runner.
 *
 * Answering is optimistic: the selection lands immediately and the write is
 * drained by a background queue, so navigation never waits on the network.
 * Nothing about correctness exists on the client — scoring, solutions, and weak
 * concepts are only produced by the backend after submission.
 */
export default function PracticeSession({ scope }: { scope: PracticeScope }) {
  const router = useRouter();
  const started = useRef(false);
  const [payload, setPayload] = useState<PracticeAttemptPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sync, setSync] = useState<PracticeSyncState>(IDLE_SYNC);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const queueRef = useRef<PracticeAnswerQueue | null>(null);
  /** When the current question came on screen, for per-question timing. */
  const questionOpenedAtRef = useRef(0);
  // Mirrors `confidence` so the keyboard-answer path (whose handler closure is
  // only refreshed per question) always reads the latest rating, not a stale one.
  const confidenceRef = useRef<Record<string, number>>({});
  useEffect(() => {
    confidenceRef.current = confidence;
  }, [confidence]);

  const createOrResume = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PracticeAttemptPayload>(
        "/api/practice/sessions",
        {
          method: "POST",
          body: JSON.stringify(scope),
        },
      );
      if (data.attempt.status === "SUBMITTED") {
        router.replace(`/practice/${data.attempt.id}/review`);
        return;
      }
      setPayload(data);
      setAnswers(
        Object.fromEntries(
          data.answers.map((answer) => [
            answer.questionId,
            answer.selectedOption,
          ]),
        ),
      );
      // Resume where the learner left off rather than always at question one.
      const firstGap = data.questions.findIndex(
        (question) =>
          !data.answers.some((answer) => answer.questionId === question.id),
      );
      setCurrentIndex(firstGap < 0 ? 0 : firstGap);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The practice session could not be prepared.",
      );
    } finally {
      setLoading(false);
    }
  }, [router, scope]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void createOrResume();
  }, [createOrResume]);

  // The autosave queue lives for as long as the attempt does.
  useEffect(() => {
    const attemptId = payload?.attempt.id;
    if (!attemptId) return;
    const queue = new PracticeAnswerQueue(
      (draft) =>
        apiFetch(
          `/api/practice/sessions/${attemptId}/answers/${draft.questionId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              selectedOption: draft.selectedOption,
              elapsedSeconds: draft.elapsedSeconds,
              confidence: draft.confidence,
            }),
          },
        ).then(() => undefined),
      setSync,
    );
    queueRef.current = queue;
    return () => {
      queue.stop();
      queueRef.current = null;
    };
  }, [payload?.attempt.id]);

  // Session clock, driven from the server-issued start time.
  useEffect(() => {
    const startedAt = payload?.attempt.startedAt;
    if (!startedAt) return;
    const tick = () => setElapsedSeconds(elapsedPracticeSeconds(startedAt));
    tick();
    const interval = window.setInterval(tick, 1_000);
    return () => window.clearInterval(interval);
  }, [payload?.attempt.startedAt]);

  useEffect(() => {
    questionOpenedAtRef.current = Date.now();
  }, [currentIndex]);

  // Leaving with unsaved answers is worth a browser-level warning.
  useEffect(() => {
    if (sync.pending === 0) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [sync.pending]);

  const questions = useMemo(() => payload?.questions ?? [], [payload]);
  const questionIds = useMemo(
    () => questions.map((question) => question.id),
    [questions],
  );
  const progress = useMemo(
    () => summarizePracticeProgress(questionIds, answers, marked),
    [answers, marked, questionIds],
  );

  const select = (selectedOption: string) => {
    const question = questions[currentIndex];
    if (!question || submitting) return;
    setAnswers((current) => ({ ...current, [question.id]: selectedOption }));
    setError(null);
    queueRef.current?.enqueue({
      questionId: question.id,
      selectedOption,
      // Per-question time, which is what the analytics actually mean.
      elapsedSeconds: elapsedPracticeSeconds(questionOpenedAtRef.current),
      confidence: confidenceRef.current[question.id],
    });
  };

  // A pre-answer self-rating. If a choice is already made, resend it so the
  // confidence lands on the same answer row; otherwise it is remembered and
  // attached when the learner picks an option.
  const rate = (level: number) => {
    const question = questions[currentIndex];
    if (!question || submitting) return;
    setConfidence((current) => ({ ...current, [question.id]: level }));
    const selectedOption = answers[question.id];
    if (selectedOption) {
      queueRef.current?.enqueue({
        questionId: question.id,
        selectedOption,
        elapsedSeconds: elapsedPracticeSeconds(questionOpenedAtRef.current),
        confidence: level,
      });
    }
  };

  const goTo = useCallback(
    (index: number) => {
      if (questions.length === 0) return;
      setCurrentIndex(Math.max(0, Math.min(questions.length - 1, index)));
    },
    [questions.length],
  );

  const toggleMark = () => {
    const question = questions[currentIndex];
    if (!question) return;
    setMarked((current) => {
      const next = new Set(current);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  };

  const submit = async () => {
    if (!payload || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/practice/sessions/${payload.attempt.id}/submit`, {
        method: "POST",
      });
      router.replace(`/practice/${payload.attempt.id}/review`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The practice session could not be submitted.",
      );
      setSubmitting(false);
      setConfirmingSubmit(false);
    }
  };

  useEffect(() => {
    if (!payload || confirmingSubmit || submitting) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const question = payload.questions[currentIndex];
      if (!question) return;
      const optionIndex = Number.parseInt(event.key, 10) - 1;
      if (Number.isInteger(optionIndex) && question.options[optionIndex]) {
        event.preventDefault();
        select(question.options[optionIndex]);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(currentIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(currentIndex - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // `select` is stable enough for this handler; it only reads current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmingSubmit, currentIndex, goTo, payload, submitting]);

  if (loading) return <PracticeSkeleton />;

  if (!payload) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
        <CircleAlert className="h-9 w-9 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink">
          We could not open this practice set
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          {error ?? "The selected topic is not available right now."}
        </p>
        <button
          type="button"
          onClick={() => void createOrResume()}
          className="mt-6 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-strong"
        >
          Try again
        </button>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isMarked = marked.has(question.id);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8 lg:p-10">
      <header className="rounded-2xl border border-hairline bg-surface px-3 py-2.5 shadow-[0_8px_22px_rgba(20,20,30,0.04)] sm:px-4">
        <div className="flex items-center gap-3">
          <h1 className="min-w-0 truncate font-heading text-sm font-bold tracking-tight text-ink sm:text-base">
            {payload.attempt.title}
          </h1>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white">
            <Timer className="h-3 w-3" aria-hidden="true" />
            {formatDuration(elapsedSeconds)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-ink-mute">
          <span className="shrink-0 text-ink-soft">
            {progress.answered}/{payload.attempt.totalQuestions} answered
          </span>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas"
            role="progressbar"
            aria-valuenow={progress.answered}
            aria-valuemin={0}
            aria-valuemax={payload.attempt.totalQuestions}
            aria-label="Answered questions"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{
                width: `${Math.round((progress.answered / Math.max(1, payload.attempt.totalQuestions)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </header>

      {error && (
        <p
          className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-primary-tint px-3 py-1.5 text-primary">
                {question.difficulty}
              </span>
              <span className="rounded-full bg-canvas px-3 py-1.5 text-ink-soft">
                {question.bloomLevel}
              </span>
              <span className="rounded-full bg-canvas px-3 py-1.5 text-ink-soft">
                {question.marks} marks
              </span>
            </div>
            <p className="text-sm font-semibold text-ink-soft">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>

          <section className="rounded-[1.4rem] border border-hairline bg-surface p-5 shadow-[0_12px_28px_rgba(20,20,30,0.05)] sm:p-7">
            <StudyMarkdown className="font-heading text-xl font-bold leading-8 text-ink sm:text-2xl">
              {question.questionText}
            </StudyMarkdown>
            <ConfidenceSelector
              value={confidence[question.id] ?? null}
              onRate={rate}
              disabled={submitting}
            />
            <div
              className="mt-6 space-y-3"
              role="radiogroup"
              aria-label="Answer options"
            >
              {question.options.map((option, index) => {
                const selected = answers[question.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={submitting}
                    onClick={() => select(option)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-medium transition sm:p-5 ${
                      selected
                        ? "border-primary bg-primary-tint text-primary-strong ring-1 ring-primary"
                        : "border-hairline text-ink hover:border-primary/45 hover:bg-primary-tint/40"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                        selected
                          ? "bg-primary text-white"
                          : "bg-canvas text-ink-mute"
                      }`}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <StudyMarkdown className="flex-1 min-w-0 text-sm font-medium">
                      {option}
                    </StudyMarkdown>
                    {selected && (
                      <CheckCircle2
                        className="h-5 w-5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <SyncStatus
              sync={sync}
              answered={Boolean(answers[question.id])}
              onRetry={() => queueRef.current?.retryNow()}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMark}
                aria-pressed={isMarked}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  isMarked
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-hairline text-ink-soft hover:bg-canvas"
                }`}
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
                {isMarked ? "Marked for review" : "Mark for review"}
              </button>
              <ReportQuestionButton
                questionSource="CURATED"
                questionRefId={question.id}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0 || submitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-hairline px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </button>
            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => setConfirmingSubmit(true)}
                disabled={submitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.22)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                Review and submit
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo(currentIndex + 1)}
                disabled={submitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        <aside className="rounded-[1.5rem] border border-hairline bg-surface p-4 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:rounded-[1.75rem] sm:p-5 xl:self-start">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold text-ink">
              Question map
            </h2>
            <span className="text-xs font-semibold text-ink-soft">
              {progress.answered}/{questions.length}
            </span>
          </div>
          <div
            className="mt-5 grid grid-cols-5 gap-2"
            aria-label="Question navigation"
          >
            {questions.map((item, index) => {
              const isCurrent = index === currentIndex;
              const isAnswered = Boolean(answers[item.id]);
              const isFlagged = marked.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(index)}
                  disabled={submitting}
                  aria-label={`Go to question ${index + 1}${isAnswered ? ", answered" : ", not answered"}${isFlagged ? ", marked for review" : ""}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`relative grid aspect-square place-items-center rounded-lg text-xs font-bold transition ${
                    isCurrent
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : isAnswered
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-canvas text-ink-soft hover:bg-primary-tint"
                  }`}
                >
                  {index + 1}
                  {isFlagged ? (
                    <span
                      className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <dl className="mt-6 space-y-1.5 border-t border-hairline pt-5 text-xs text-ink-soft">
            <div className="flex items-center justify-between">
              <dt>Answered</dt>
              <dd className="font-bold text-ink">{progress.answered}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Marked for review</dt>
              <dd className="font-bold text-ink">
                {progress.markedForReview.length}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Left</dt>
              <dd className="font-bold text-ink">
                {progress.unanswered.length}
              </dd>
            </div>
          </dl>

          {progress.firstUnansweredIndex !== null ? (
            <button
              type="button"
              onClick={() => {
                const next = nextUnansweredIndex(
                  questionIds,
                  answers,
                  currentIndex,
                );
                if (next !== null) goTo(next);
              }}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-hairline px-3 py-2 text-xs font-bold text-ink-soft transition hover:bg-canvas"
            >
              Jump to next unanswered
            </button>
          ) : null}

          <p className="mt-4 text-xs leading-5 text-ink-mute">
            Results and explanations unlock only after submission.
          </p>

          <button
            type="button"
            onClick={() => setConfirmingSubmit(true)}
            disabled={submitting}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-tint px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Submit practice
          </button>
        </aside>
      </div>

      {confirmingSubmit ? (
        <SubmitConfirmation
          answered={progress.answered}
          total={questions.length}
          unanswered={progress.unanswered}
          markedForReview={progress.markedForReview}
          pendingSaves={sync.pending}
          submitting={submitting}
          onCancel={() => setConfirmingSubmit(false)}
          onGoToQuestion={(position) => {
            setConfirmingSubmit(false);
            goTo(position - 1);
          }}
          onConfirm={() => void submit()}
        />
      ) : null}
    </div>
  );
}

const CONFIDENCE_LEVELS: Array<{ level: number; label: string }> = [
  { level: 1, label: "Unsure" },
  { level: 2, label: "Maybe" },
  { level: 3, label: "Confident" },
];

/**
 * Optional pre-answer self-rating. It captures how sure the learner feels
 * before committing, which the review screen turns into over/under-confidence
 * feedback. Skipping it never blocks answering.
 */
function ConfidenceSelector({
  value,
  onRate,
  disabled,
}: {
  value: number | null;
  onRate: (level: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-hairline bg-canvas/60 px-3 py-2.5">
      <span className="text-xs font-bold text-ink-mute">How sure are you?</span>
      <div className="flex gap-1.5" role="group" aria-label="Confidence rating">
        {CONFIDENCE_LEVELS.map((item) => {
          const selected = value === item.level;
          return (
            <button
              key={item.level}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onRate(item.level)}
              className={`min-h-8 rounded-lg px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "bg-primary text-white"
                  : "border border-hairline bg-surface text-ink-soft hover:border-primary/40 hover:text-primary"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <span className="text-[11px] text-ink-mute">Optional</span>
    </div>
  );
}

function SyncStatus({
  sync,
  answered,
  onRetry,
}: {
  sync: PracticeSyncState;
  answered: boolean;
  onRetry: () => void;
}) {
  if (sync.failed) {
    return (
      <p className="flex items-center gap-2 text-xs font-semibold text-rose-700">
        <CircleAlert className="h-4 w-4" aria-hidden="true" />
        {sync.pending} answer{sync.pending === 1 ? "" : "s"} not saved yet —
        retrying.
        <button
          type="button"
          onClick={onRetry}
          className="font-bold underline underline-offset-4"
        >
          Retry now
        </button>
      </p>
    );
  }
  if (sync.saving || sync.pending > 0) {
    return (
      <p
        className="flex items-center gap-2 text-xs font-semibold text-ink-soft"
        aria-live="polite"
      >
        <RefreshCw
          className="h-4 w-4 animate-spin text-primary"
          aria-hidden="true"
        />
        Saving your answer...
      </p>
    );
  }
  return (
    <p
      className="flex items-center gap-2 text-xs font-semibold text-ink-soft"
      aria-live="polite"
    >
      <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
      {answered ? "Answer saved securely." : "Choose an answer to save it."}
    </p>
  );
}

function SubmitConfirmation({
  answered,
  total,
  unanswered,
  markedForReview,
  pendingSaves,
  submitting,
  onCancel,
  onGoToQuestion,
  onConfirm,
}: {
  answered: number;
  total: number;
  unanswered: number[];
  markedForReview: number[];
  pendingSaves: number;
  submitting: boolean;
  onCancel: () => void;
  onGoToQuestion: (position: number) => void;
  onConfirm: () => void;
}) {
  useBodyScrollLock();

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-end bg-ink/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6"
      role="presentation"
      onClick={onCancel}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Confirm submission"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-t-[1.75rem] bg-surface p-5 shadow-[0_-10px_40px_rgba(20,20,30,0.2)] sm:rounded-[1.75rem] sm:p-7"
      >
        <h2 className="font-heading text-2xl font-bold tracking-tight text-ink">
          Submit this practice set?
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Scoring, solutions, and weak concepts are produced by the backend once
          you submit. The attempt cannot be edited afterwards.
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-canvas px-2 py-3">
            <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
              Answered
            </dt>
            <dd className="mt-1 font-heading text-xl font-bold text-ink">
              {answered}/{total}
            </dd>
          </div>
          <div className="rounded-2xl bg-canvas px-2 py-3">
            <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
              Unanswered
            </dt>
            <dd className="mt-1 font-heading text-xl font-bold text-ink">
              {unanswered.length}
            </dd>
          </div>
          <div className="rounded-2xl bg-canvas px-2 py-3">
            <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
              Marked
            </dt>
            <dd className="mt-1 font-heading text-xl font-bold text-ink">
              {markedForReview.length}
            </dd>
          </div>
        </dl>

        {unanswered.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-mute">
              Still unanswered
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {unanswered.map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => onGoToQuestion(position)}
                  className="min-h-9 rounded-lg bg-canvas px-3 text-xs font-bold text-ink-soft transition hover:bg-primary-tint hover:text-primary"
                >
                  Q{position}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {pendingSaves > 0 ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            <CircleAlert
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {pendingSaves} answer{pendingSaves === 1 ? "" : "s"} still syncing.
            Give it a moment so nothing is lost.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-hairline px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-canvas"
          >
            Keep working
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Submit now
          </button>
        </div>
      </section>
    </div>
  );
}

function PracticeSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center p-4 sm:p-8">
      <section className="w-full rounded-[2rem] border border-hairline bg-surface p-6 shadow-[0_22px_70px_rgba(20,20,30,0.07)]">
        <p className="flex items-center gap-3 text-sm font-semibold text-ink-soft">
          <LoaderCircle
            className="h-5 w-5 animate-spin text-primary"
            aria-hidden="true"
          />
          Preparing your balanced practice set...
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_16rem]">
          <div className="rounded-[1.5rem] bg-canvas p-5">
            <div className="h-5 w-44 rounded-full skeleton" />
            <div className="mt-5 h-20 rounded-2xl skeleton" />
            <div className="mt-5 space-y-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-12 rounded-2xl skeleton" />
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-canvas p-5">
            <div className="h-5 w-28 rounded-full skeleton" />
            <div className="mt-5 grid grid-cols-5 gap-2">
              {Array.from({ length: 15 }, (_, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg skeleton"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
