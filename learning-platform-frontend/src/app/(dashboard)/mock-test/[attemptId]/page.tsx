"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Send,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import StudyMarkdown from "@/components/learning/StudyMarkdown";
import { formatDuration } from "@/lib/format";
import type {
  MockTestAttemptPayload,
  MockTestReviewPayload,
} from "@/lib/mock-test-types";

function scoreTone(scorePercent: number) {
  if (scorePercent >= 70) return "text-emerald-700";
  if (scorePercent >= 40) return "text-amber-700";
  return "text-rose-700";
}

export default function MockTestAttemptPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;

  const [payload, setPayload] = useState<MockTestAttemptPayload | null>(null);
  const [review, setReview] = useState<MockTestReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const saveTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<MockTestAttemptPayload>(
        `/api/mock-tests/${attemptId}`,
      );
      setPayload(data);
      setAnswers(
        Object.fromEntries(
          data.answers.map((answer) => [answer.questionId, answer.selectedOption]),
        ),
      );
      if (data.attempt.status === "SUBMITTED") {
        setReview(
          await apiFetch<MockTestReviewPayload>(
            `/api/mock-tests/${attemptId}/review`,
          ),
        );
      }
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "This mock test could not be opened.",
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    if (!payload || payload.attempt.status !== "IN_PROGRESS") return;
    const tick = () => {
      const secondsLeft = Math.max(
        0,
        Math.round(
          (new Date(payload.attempt.expiresAt).getTime() - Date.now()) / 1000,
        ),
      );
      setRemainingSeconds(secondsLeft);
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [payload]);

  const question = payload?.questions[currentIndex] ?? null;

  const select = (option: string) => {
    if (!question || !payload || payload.attempt.status !== "IN_PROGRESS") return;
    setAnswers((current) => ({ ...current, [question.id]: option }));
    setSaving(true);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await apiFetch(`/api/mock-tests/${attemptId}/answers/${question.id}`, {
          method: "PUT",
          body: JSON.stringify({ selectedOption: option }),
        });
      } catch {
        // Best-effort autosave; the next navigation or submit will retry the state.
      } finally {
        setSaving(false);
      }
    }, 300);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/mock-tests/${attemptId}/submit`, { method: "POST" });
      await load();
      setConfirmSubmit(false);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "The mock test could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-5">
        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
          <p className="mt-3 text-sm font-semibold text-rose-800">{error}</p>
          <Link
            href="/mock-test"
            className="mt-4 inline-block text-sm font-bold text-primary underline"
          >
            Back to mock tests
          </Link>
        </div>
      </div>
    );
  }

  if (!payload) return null;

  if (payload.attempt.status === "SUBMITTED") {
    return <MockTestResults review={review} loading={!review} />;
  }

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-8 sm:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              Full mock test
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-soft">
              {answeredCount} of {payload.attempt.totalQuestions} answered
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-bold tabular-nums text-white">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {formatDuration(remainingSeconds)}
          </div>
        </div>

        <div
          className="mt-4 grid gap-1.5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(2.25rem, 1fr))",
          }}
        >
          {payload.questions.map((q, index) => {
            const isAnswered = Boolean(answers[q.id]);
            const isCurrent = index === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-9 rounded-lg text-xs font-bold tabular-nums transition duration-200 ease-out-soft active:scale-90 ${
                  isCurrent
                    ? "bg-ink text-white"
                    : isAnswered
                      ? "bg-primary-tint text-primary"
                      : "bg-surface text-ink-mute ring-1 ring-hairline hover:bg-canvas"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        {question ? (
          <section
            key={question.id}
            className="mt-5 animate-fade rounded-[1.4rem] border border-hairline bg-surface p-5 shadow-[0_12px_28px_rgba(20,20,30,0.05)] sm:p-7"
          >
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-primary-tint px-2.5 py-1 text-primary">
                {question.subject}
              </span>
              <span className="rounded-full bg-canvas px-2.5 py-1 text-ink-soft">
                {question.chapter}
              </span>
              <span className="ml-auto text-ink-mute">
                Question {currentIndex + 1} of {payload.questions.length}
              </span>
            </div>
            <StudyMarkdown className="mt-4 font-heading text-xl font-bold leading-8 text-ink sm:text-2xl">
              {question.questionText}
            </StudyMarkdown>
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
                    onClick={() => select(option)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-medium transition duration-200 ease-out-soft active:scale-[0.99] sm:p-5 ${
                      selected
                        ? "border-primary bg-primary-tint text-primary-strong ring-1 ring-primary"
                        : "border-hairline text-ink hover:border-primary/45 hover:bg-primary-tint/40"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                        selected ? "bg-primary text-white" : "bg-canvas text-ink-mute"
                      }`}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <StudyMarkdown className="min-w-0 flex-1 text-sm font-medium">
                      {option}
                    </StudyMarkdown>
                    {selected && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            disabled={currentIndex === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-hairline px-4 py-2.5 text-sm font-bold text-ink-soft transition duration-200 ease-out-soft hover:bg-canvas active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>
          <div className="flex items-center gap-3">
            {saving ? (
              <span className="text-xs font-semibold text-ink-mute">Saving…</span>
            ) : null}
            {currentIndex === payload.questions.length - 1 ? (
              confirmSubmit ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink-soft">
                    {payload.attempt.totalQuestions - answeredCount} unanswered.
                    Submit anyway?
                  </span>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={submitting}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition duration-200 ease-out-soft hover:bg-primary-strong active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
                  >
                    {submitting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Confirm submit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmSubmit(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition duration-200 ease-out-soft hover:bg-primary-strong active:scale-[0.97]"
                >
                  <Send className="h-4 w-4" />
                  Submit mock test
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((index) =>
                    Math.min(payload.questions.length - 1, index + 1),
                  )
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition duration-200 ease-out-soft hover:bg-ink/90 active:scale-[0.97]"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function MockTestResults({
  review,
  loading,
}: {
  review: MockTestReviewPayload | null;
  loading: boolean;
}) {
  const [showAllItems, setShowAllItems] = useState(false);

  const visibleItems = useMemo(() => {
    if (!review) return [];
    return showAllItems ? review.items : review.items.slice(0, 8);
  }, [review, showAllItems]);

  if (loading || !review) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const { attempt } = review;

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-4xl px-5 pt-8 sm:px-8 sm:pt-10">
        <section className="animate-rise overflow-hidden rounded-[1.8rem] bg-ink p-6 text-white shadow-[0_18px_45px_rgba(20,20,30,0.16)] sm:p-8">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
            <Trophy className="h-3.5 w-3.5" />
            Mock test result
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-8">
            <div>
              <p className="font-heading text-5xl font-bold text-white">
                {attempt.scorePercent}%
              </p>
              <p className="mt-1 text-sm text-white/60">
                {attempt.percentile !== null
                  ? `${attempt.percentile}th percentile on this platform`
                  : "Percentile pending"}
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <span>
                <span className="block font-heading text-xl font-bold">
                  {attempt.subjectCounts.reduce(
                    (sum, s) => sum + s.count,
                    0,
                  )}
                </span>
                <span className="text-white/50">Questions</span>
              </span>
            </div>
          </div>
          <p className="mt-4 max-w-lg text-xs leading-5 text-white/50">
            Percentile is measured against other submitted mock tests on this
            platform, not the official national JEE cohort.
          </p>
        </section>

        <section className="mt-5 grid animate-fade gap-3 [animation-delay:80ms] sm:grid-cols-3">
          {review.subjectBreakdown.map((subject, index) => (
            <div
              key={subject.subject}
              className="animate-rise rounded-2xl border border-hairline bg-surface p-4"
              style={{ animationDelay: `${100 + index * 60}ms` }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-mute">
                {subject.subject}
              </p>
              <p
                className={`mt-2 font-heading text-2xl font-bold ${scoreTone(subject.scorePercent)}`}
              >
                {subject.scorePercent}%
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {subject.correct} correct · {subject.incorrect} wrong ·{" "}
                {subject.unattempted} skipped
              </p>
            </div>
          ))}
        </section>

        {review.weakestChapters.length > 0 ? (
          <section className="mt-5 rounded-2xl border border-hairline bg-surface p-5">
            <p className="text-sm font-bold text-ink">
              Chapters that cost you the most marks
            </p>
            <div className="mt-3 space-y-2">
              {review.weakestChapters.map((chapter) => (
                <div
                  key={`${chapter.subject}-${chapter.chapter}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-3.5 py-2.5"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-ink">
                    {chapter.chapter}{" "}
                    <span className="text-ink-mute">· {chapter.subject}</span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-rose-600">
                    -{chapter.lostMarks} marks
                    {chapter.unattempted > 0
                      ? ` · ${chapter.unattempted} skipped`
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">Review your answers</p>
            {review.items.length > 8 ? (
              <button
                type="button"
                onClick={() => setShowAllItems((value) => !value)}
                className="text-xs font-bold text-primary underline underline-offset-4"
              >
                {showAllItems ? "Show fewer" : `Show all ${review.items.length}`}
              </button>
            ) : null}
          </div>
          <div className="mt-3 space-y-3">
            {visibleItems.map((item, index) => (
              <details
                key={item.id}
                className="rounded-2xl border border-hairline bg-surface p-4"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  {item.isCorrect === true ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : item.isCorrect === false ? (
                    <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                  ) : (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-canvas text-[10px] font-bold text-ink-mute">
                      —
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    Q{index + 1}. {item.questionText}
                  </span>
                </summary>
                <div className="mt-3 border-t border-hairline pt-3 text-sm leading-6 text-ink-soft">
                  <p>
                    <span className="font-semibold text-ink">Your answer: </span>
                    {item.selectedOption ?? "Not attempted"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-emerald-700">
                      Correct answer:{" "}
                    </span>
                    {item.correctAnswer}
                  </p>
                  <p className="mt-2">{item.solution}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between">
          <Link
            href="/mock-test"
            className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft transition duration-200 ease-out-soft hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to mock tests
          </Link>
          <Link
            href="/mock-test"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition duration-200 ease-out-soft hover:bg-primary-strong active:scale-[0.97]"
          >
            <Sparkles className="h-4 w-4" />
            Take another
          </Link>
        </div>
      </main>
    </div>
  );
}
