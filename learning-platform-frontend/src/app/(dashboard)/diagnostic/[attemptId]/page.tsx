"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  Save,
  Send,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { DiagnosticAttemptPayload } from "@/lib/diagnostic-types";
import { formatDuration } from "@/lib/format";
import StudyMarkdown from "@/components/learning/StudyMarkdown";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

const OPTION_KEYS = ["1", "2", "3", "4", "5", "6"];

export default function DiagnosticAttemptPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();
  const attemptId = params.attemptId;
  const [payload, setPayload] = useState<DiagnosticAttemptPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  // Questions with a save in flight. A Set (not a single id) lets answers save
  // concurrently, so a slow save never blocks answering the next question.
  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useBodyScrollLock(confirmingSubmit);

  const loadAttempt = useCallback(async () => {
    if (!attemptId) return;
    try {
      const data = await apiFetch<DiagnosticAttemptPayload>(
        `/api/diagnostics/${attemptId}`,
      );
      setPayload(data);
      setAnswers(
        Object.fromEntries(
          data.answers.map((answer) => [
            answer.questionId,
            answer.selectedOption,
          ]),
        ),
      );
      setNow(Date.now());
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to load this test.",
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    const loadInitialAttempt = async () => {
      await loadAttempt();
    };
    void loadInitialAttempt();
  }, [loadAttempt]);

  // Live countdown clock.
  useEffect(() => {
    if (!payload) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [payload]);

  const remainingSeconds = useMemo(() => {
    if (!payload) return 0;
    return Math.max(
      0,
      Math.ceil((new Date(payload.attempt.expiresAt).getTime() - now) / 1000),
    );
  }, [now, payload]);

  const submitAttempt = useCallback(async () => {
    if (!payload || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/diagnostics/${payload.attempt.id}/submit`, {
        method: "POST",
      });
      router.replace(`/analysis/${payload.attempt.id}`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to submit the test.",
      );
      setSubmitting(false);
    }
  }, [payload, router, submitting]);

  // Auto-submit when the timer runs out, or redirect if already submitted.
  useEffect(() => {
    if (!payload) return;
    if (payload.attempt.status !== "IN_PROGRESS") {
      router.replace(`/analysis/${payload.attempt.id}`);
      return;
    }
    if (remainingSeconds === 0) {
      const timer = window.setTimeout(() => void submitAttempt(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [payload, remainingSeconds, router, submitAttempt]);

  const markSaving = (questionId: string, saving: boolean) =>
    setSavingIds((current) => {
      const next = new Set(current);
      if (saving) next.add(questionId);
      else next.delete(questionId);
      return next;
    });

  const saveSelection = async (selectedOption: string) => {
    const question = payload?.questions[currentIndex];
    // Answering is never blocked by an in-flight save: the selection lands
    // locally at once and its own write drains in the background.
    if (!payload || !question || submitting) return;

    const previousOption = answers[question.id];
    if (previousOption === selectedOption) return;
    setAnswers((current) => ({ ...current, [question.id]: selectedOption }));
    markSaving(question.id, true);
    setError(null);

    const startedAt = new Date(payload.attempt.startedAt).getTime();
    const expiresAt = new Date(payload.attempt.expiresAt).getTime();
    const elapsedSeconds = Math.max(
      0,
      Math.min(
        Math.floor((expiresAt - startedAt) / 1000),
        Math.floor((now - startedAt) / 1000),
      ),
    );

    try {
      await apiFetch(
        `/api/diagnostics/${payload.attempt.id}/answers/${question.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            selectedOption,
            elapsedSeconds,
            confidence: confidence[question.id],
          }),
        },
      );
    } catch (reason) {
      // Roll back only if a newer selection has not since replaced this one, so
      // a late failure never clobbers a choice the learner already changed.
      setAnswers((current) => {
        if (current[question.id] !== selectedOption) return current;
        const restored = { ...current };
        if (previousOption === undefined) delete restored[question.id];
        else restored[question.id] = previousOption;
        return restored;
      });
      setError(
        reason instanceof Error
          ? reason.message
          : "Your answer could not be saved.",
      );
    } finally {
      markSaving(question.id, false);
    }
  };

  // Pre-answer self-rating. Persisted with the answer once an option exists (the
  // save endpoint requires a selection); until then it is just remembered.
  const rateConfidence = (level: number) => {
    const question = payload?.questions[currentIndex];
    if (!payload || !question || submitting) return;
    setConfidence((current) => ({ ...current, [question.id]: level }));
    const selectedOption = answers[question.id];
    if (!selectedOption) return;
    const startedAt = new Date(payload.attempt.startedAt).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
    void apiFetch(
      `/api/diagnostics/${payload.attempt.id}/answers/${question.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          selectedOption,
          elapsedSeconds,
          confidence: level,
        }),
      },
    ).catch(() => undefined);
  };

  const goTo = useCallback(
    (index: number) => {
      if (!payload) return;
      setCurrentIndex(
        Math.max(0, Math.min(payload.questions.length - 1, index)),
      );
    },
    [payload],
  );

  // Keyboard: 1-N to answer, arrows to move between questions.
  useEffect(() => {
    if (!payload || confirmingSubmit || submitting) return;
    const question = payload.questions[currentIndex];
    if (!question) return;
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
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(currentIndex + 1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(currentIndex - 1);
        return;
      }
      const index = OPTION_KEYS.indexOf(event.key);
      if (index < 0) return;
      const option = question.options[index];
      if (!option) return;
      event.preventDefault();
      void saveSelection(option);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, currentIndex, confirmingSubmit, submitting, goTo]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm font-semibold text-ink-soft">
        <span className="flex items-center gap-3">
          <LoaderCircle
            className="h-5 w-5 animate-spin text-primary"
            aria-hidden="true"
          />
          Preparing your test…
        </span>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
        <CircleAlert className="h-9 w-9 text-rose-600" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-ink">
          This test could not be opened
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          {error ?? "Please return to the test centre and try again."}
        </p>
        <button
          type="button"
          onClick={() => void loadAttempt()}
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-strong"
        >
          Try again
        </button>
      </div>
    );
  }

  const question = payload.questions[currentIndex];
  const isLastQuestion = currentIndex === payload.questions.length - 1;
  const answeredCount = payload.questions.filter((item) =>
    Boolean(answers[item.id]),
  ).length;
  const progressPercent = Math.round(
    (answeredCount / Math.max(1, payload.questions.length)) * 100,
  );
  const isSavingCurrent = savingIds.has(question.id);
  const lowTime = remainingSeconds <= 60;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="rounded-2xl border border-hairline bg-surface px-3 py-2.5 shadow-[0_8px_22px_rgba(20,20,30,0.04)] sm:px-4">
        <div className="flex items-center gap-3">
          <h1 className="min-w-0 truncate font-heading text-sm font-bold tracking-tight text-ink sm:text-base">
            {payload.attempt.title}
          </h1>
          <span
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${
              lowTime ? "animate-pulse bg-rose-600" : "bg-ink"
            }`}
          >
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {formatDuration(remainingSeconds)}
          </span>
          <button
            type="button"
            onClick={() => setConfirmingSubmit(true)}
            disabled={submitting}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[13px] font-bold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Submit
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-ink-mute">
          <span className="shrink-0 text-ink-soft">
            {answeredCount}/{payload.questions.length} answered
          </span>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas"
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={payload.questions.length}
            aria-label="Answered questions"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums">{progressPercent}%</span>
        </div>
      </header>

      {error ? (
        <p
          className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="rounded-full bg-primary-tint px-2 py-0.5 text-primary">
              {question.difficulty}
            </span>
            <span className="px-0.5 text-ink-mute">{"\u00B7"}</span>
            <span className="rounded-full bg-canvas px-2 py-0.5 text-ink-soft">
              {question.bloomLevel}
            </span>
            <span className="px-0.5 text-ink-mute">{"\u00B7"}</span>
            <span className="rounded-full bg-canvas px-2 py-0.5 text-ink-soft">
              {question.marks} mark{question.marks === 1 ? "" : "s"}
            </span>
            <span className="ml-auto text-[11px] font-medium text-ink-mute">
              Question {currentIndex + 1} of {payload.questions.length}
            </span>
          </div>

          <section className="rounded-[1.25rem] border border-hairline bg-surface p-4 shadow-[0_12px_28px_rgba(20,20,30,0.045)] sm:p-5">
            <StudyMarkdown className="font-heading text-lg font-bold leading-7 text-ink sm:text-xl sm:leading-8">
              {question.questionText}
            </StudyMarkdown>
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-hairline bg-canvas/60 px-3 py-2">
              <span className="text-xs font-bold text-ink-mute">
                How sure are you?
              </span>
              <div
                className="flex gap-1.5"
                role="group"
                aria-label="Confidence rating"
              >
                {[
                  { level: 1, label: "Unsure" },
                  { level: 2, label: "Maybe" },
                  { level: 3, label: "Confident" },
                ].map((item) => {
                  const active = confidence[question.id] === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      aria-pressed={active}
                      disabled={submitting}
                      onClick={() => rateConfidence(item.level)}
                      className={`min-h-8 rounded-lg px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        active
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
            <div
              className="mt-4 space-y-2.5"
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
                    onClick={() => void saveSelection(option)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition sm:px-4 ${
                      selected
                        ? "border-primary bg-primary-tint text-primary-strong ring-1 ring-primary"
                        : "border-hairline bg-canvas text-ink hover:border-primary/45 hover:bg-primary-tint/40"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                        selected
                          ? "bg-primary text-white"
                          : "bg-surface text-ink-mute"
                      }`}
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <StudyMarkdown className="flex-1 min-w-0 text-sm font-medium">
                      {option}
                    </StudyMarkdown>
                    {selected ? (
                      <CheckCircle2
                        className="h-5 w-5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-ink-mute">
              <Save className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {isSavingCurrent
                ? "Saving answer…"
                : answers[question.id]
                  ? "Answer saved securely."
                  : "Select an option to autosave. Press 1–" +
                    question.options.length +
                    " or arrow keys to navigate."}
            </p>
          </section>

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                {submitting ? (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                Submit test
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

        <aside className="rounded-[1.25rem] border border-hairline bg-surface p-4 shadow-[0_12px_28px_rgba(20,20,30,0.045)] xl:min-h-0 xl:overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold text-ink">
              Question map
            </h2>
            <span className="text-xs font-semibold text-ink-mute">
              {answeredCount} saved
            </span>
          </div>
          <div
            className="mt-4 grid grid-cols-5 gap-2"
            aria-label="Question navigation"
          >
            {payload.questions.map((item, index) => {
              const isCurrent = index === currentIndex;
              const isAnswered = Boolean(answers[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(index)}
                  disabled={submitting}
                  aria-label={`Go to question ${index + 1}${isAnswered ? ", answered" : ""}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`grid aspect-square place-items-center rounded-lg text-xs font-bold transition ${
                    isCurrent
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : isAnswered
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-canvas text-ink-mute hover:bg-primary-tint/50"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-5 space-y-2 border-t border-hairline pt-4 text-[11px] text-ink-mute">
            <p className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-emerald-400"
                aria-hidden="true"
              />
              Answer saved
            </p>
            <p className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-slate-300"
                aria-hidden="true"
              />
              Not yet answered
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmingSubmit(true)}
            disabled={submitting}
            className="mt-5 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
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
        </aside>
      </div>

      {confirmingSubmit ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-[0_24px_70px_rgba(20,20,30,0.24)]">
            <h2 className="font-heading text-lg font-bold text-ink">
              Submit this test?
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              You have answered{" "}
              <span className="font-bold text-ink">{answeredCount}</span> of{" "}
              {payload.questions.length} questions. Scoring, solutions, and weak
              concepts are produced by the backend once you submit — the attempt
              cannot be edited afterwards.
              {payload.questions.length - answeredCount > 0
                ? ` ${payload.questions.length - answeredCount} question${
                    payload.questions.length - answeredCount === 1 ? "" : "s"
                  } will be marked unanswered.`
                : ""}
            </p>
            {error ? (
              <p
                className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
                role="alert"
              >
                <CircleAlert
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmingSubmit(false)}
                disabled={submitting}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-hairline px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
              >
                Keep working
              </button>
              <button
                type="button"
                onClick={() => void submitAttempt()}
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
      ) : null}
    </div>
  );
}
