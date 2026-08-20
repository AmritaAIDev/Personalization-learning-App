"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  BadgeCheck,
  BookMarked,
  CheckCircle2,
  CircleAlert,
  Layers3,
  LoaderCircle,
  MessagesSquare,
  XCircle,
  RefreshCw,
  Square,
  Target,
  Trophy,
} from "lucide-react";
import { describeRoundOutcome, isMissTransition, learningUrl } from "@/lib/learning";
import ReportQuestionButton from "@/components/ReportQuestionButton";
import TargetedPracticeCard from "./TargetedPracticeCard";
import type {
  LearningAnswerPayload,
  LearningScope,
  LearningSessionPayload,
  LearningSessionTransition,
} from "@/lib/learning-types";
import StudyAssistant from "./StudyAssistant";

const StudyMarkdown = dynamic(() => import("./StudyMarkdown"), {
  ssr: false,
});

type Feedback = LearningAnswerPayload["feedback"] | null;
type MissedItem = LearningSessionPayload["currentItem"];

export type PracticeWorkspaceProps = {
  payload: LearningSessionPayload | null;
  feedback: Feedback;
  /** The question just answered wrong, kept for the round-outcome's "try a similar one". */
  missedItem: MissedItem;
  scope: LearningScope;
  loading: boolean;
  answering: boolean;
  error: string | null;
  onStart: () => void;
  onAnswer: (selectedOption: string) => void;
  onContinue: () => void;
  onStop: () => void;
  onOpenFlashcards: () => void;
};

const OPTION_KEYS = ["1", "2", "3", "4", "5", "6"];

export default function PracticeWorkspace({
  payload,
  feedback,
  missedItem,
  scope,
  loading,
  answering,
  error,
  onStart,
  onAnswer,
  onContinue,
  onStop,
  onOpenFlashcards,
}: PracticeWorkspaceProps) {
  const [tutorPrompt, setTutorPrompt] = useState<{
    prompt: string;
    nonce: number;
  } | null>(null);

  if (!payload && loading) return <StartingSkeleton />;
  if (!payload) {
    return <StartPanel error={error} loading={loading} onStart={onStart} />;
  }

  const complete = payload.session.status !== "ACTIVE";
  return (
    <div className="space-y-3 xl:flex xl:h-full xl:flex-col xl:overflow-hidden">
      {!complete ? <RoundProgress payload={payload} onStop={onStop} /> : null}

      <div className="grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_minmax(15rem,0.5fr)] xl:items-stretch">
        <section className="flex min-h-[24rem] flex-col rounded-[1.25rem] border border-hairline bg-surface p-3 shadow-[0_12px_30px_rgba(20,20,30,0.045)] sm:p-4 xl:min-h-0">
          {complete ? (
            <RoundOutcome
              payload={payload}
              feedback={feedback}
              missedItem={missedItem}
              scope={scope}
              loading={loading}
              error={error}
              onContinue={onContinue}
              onStop={onStop}
              onOpenFlashcards={onOpenFlashcards}
            />
          ) : (
            // Keyed by attempt so the optimistic selection resets cleanly when
            // the question — or the retry after a hint — changes.
            <ActiveQuestion
              key={`${payload.currentItem?.id ?? "none"}-${payload.currentItem?.attemptCount ?? 0}`}
              payload={payload}
              feedback={feedback}
              answering={answering}
              error={error}
              onAnswer={onAnswer}
              onTutorPrompt={(prompt) =>
                setTutorPrompt({ prompt, nonce: Date.now() })
              }
            />
          )}
        </section>

        <div className="min-h-[24rem] xl:min-h-0 xl:overflow-hidden">
          <StudyAssistant
            key={payload.session.id}
            sessionId={payload.session.id}
            autoOpenMessage={feedback?.assistantMessage ?? null}
            externalPrompt={tutorPrompt}
            refreshWhen={feedback?.tutorPending ?? false}
            variant="panel"
            title="AI Tutor"
          />
        </div>
      </div>
    </div>
  );
}

function RoundProgress({
  payload,
  onStop,
}: {
  payload: LearningSessionPayload;
  onStop: () => void;
}) {
  const complete = payload.session.status !== "ACTIVE";
  const answered = payload.progress.filter(
    (item) => item.status === "RESOLVED",
  ).length;
  const total = payload.session.totalQuestions;
  const percent = complete
    ? 100
    : Math.round((answered / Math.max(1, total)) * 100);
  const current = complete
    ? total
    : Math.min(payload.session.currentSequence, total);
  return (
    <div className="mb-3 flex items-center gap-3 text-xs font-semibold text-ink-mute">
      <span className="shrink-0 text-ink-soft">
        Question {current}/{total}
      </span>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Round progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 tabular-nums">{percent}%</span>
      <button
        type="button"
        onClick={onStop}
        className="ml-1 inline-flex min-h-7 shrink-0 items-center gap-1 rounded-lg border border-hairline px-2 text-[11px] font-bold text-ink-soft transition hover:bg-canvas"
        title="Stop practice"
      >
        <Square className="h-3 w-3" aria-hidden="true" />
        Stop
      </button>
    </div>
  );
}
function ActiveQuestion({
  payload,
  feedback,
  answering,
  error,
  onAnswer,
  onTutorPrompt,
}: {
  payload: LearningSessionPayload;
  feedback: Feedback;
  answering: boolean;
  error: string | null;
  onAnswer: (option: string) => void;
  onTutorPrompt: (prompt: string) => void;
}) {
  const current = payload.currentItem;
  const [pendingOption, setPendingOption] = useState<string | null>(null);

  useEffect(() => {
    if (!current || answering) return;
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
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        onTutorPrompt("Give me a hint without revealing the answer.");
        return;
      }
      if (event.key === "e" || event.key === "E") {
        event.preventDefault();
        onTutorPrompt("Explain this in simpler steps.");
        return;
      }
      const index = OPTION_KEYS.indexOf(event.key);
      if (index < 0) return;
      const option = current.options[index];
      if (!option || current.attemptedOptions.includes(option)) return;
      event.preventDefault();
      setPendingOption(option);
      onAnswer(option);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answering, current, onAnswer, onTutorPrompt]);

  if (!current) return null;

  const select = (option: string) => {
    if (answering || current.attemptedOptions.includes(option)) return;
    setPendingOption(option);
    onAnswer(option);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
        <span className="rounded-full bg-primary-tint px-2 py-0.5 text-primary">
          {current.difficulty}
        </span>
        <span className="px-0.5 text-ink-mute">{"\u00B7"}</span>
        <span className="rounded-full bg-canvas px-2 py-0.5 text-ink-soft">
          {current.bloomLevel}
        </span>
        {current.requiresRetry ? (
          <span className="ml-auto rounded-full bg-warning-tint px-2.5 py-0.5 text-[11px] font-bold text-warning">
            Second attempt
          </span>
        ) : (
          <span className="ml-auto text-[11px] font-medium text-ink-mute">
            Two attempts per question
          </span>
        )}
        <ReportQuestionButton
          questionSource={current.questionSource}
          questionRefId={current.questionRefId}
          compact
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-[1.35rem] border border-hairline bg-canvas p-3 sm:p-4 custom-scrollbar">
        <StudyMarkdown className="font-heading text-[1rem] font-bold leading-6 text-ink sm:text-[1.08rem] sm:leading-7">
          {current.questionText}
        </StudyMarkdown>
        <div
          className="mt-3 space-y-2"
          role="radiogroup"
          aria-label="Answer options"
        >
          {current.options.map((option, index) => {
            const ruledOut = current.attemptedOptions.includes(option);
            const isPending = pendingOption === option && answering;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={pendingOption === option}
                disabled={answering || ruledOut}
                onClick={() => select(option)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-[13px] font-medium transition ${
                  ruledOut
                    ? "border-danger/25 bg-danger-tint text-danger line-through opacity-75"
                    : pendingOption === option
                      ? "border-primary bg-primary-tint text-primary-strong ring-1 ring-primary"
                      : "border-hairline bg-surface text-ink hover:border-primary/45 hover:bg-primary-tint/40"
                } disabled:cursor-not-allowed`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                    pendingOption === option
                      ? "bg-primary text-white"
                      : "bg-canvas text-ink-mute"
                  }`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <StudyMarkdown className="min-w-0 flex-1 text-[13px] font-medium leading-5">
                  {option}
                </StudyMarkdown>
                {ruledOut ? (
                  <XCircle
                    className="h-4 w-4 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                ) : isPending ? (
                  <LoaderCircle
                    className="h-4 w-4 shrink-0 animate-spin text-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 hidden text-[11px] font-semibold text-ink-mute sm:block">
          Press 1–{current.options.length} to answer · H hint · E explain
        </p>
      </div>

      <div className="mt-3 space-y-2" aria-live="polite">
        {answering ? (
          <p className="flex items-center gap-2 rounded-xl bg-primary-tint px-3 py-2 text-[13px] font-semibold text-primary-strong">
            <LoaderCircle
              className="h-4 w-4 animate-spin text-primary"
              aria-hidden="true"
            />
            Checking your reasoning...
          </p>
        ) : null}

        {!answering && feedback ? <AnswerFeedback feedback={feedback} /> : null}

        {error ? (
          <p
            className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-4 py-3 text-sm font-medium text-danger"
            role="alert"
          >
            <CircleAlert
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AnswerFeedback({ feedback }: { feedback: NonNullable<Feedback> }) {
  if (feedback.kind === "CORRECT") {
    return (
      <p
        className="flex items-center gap-2 rounded-2xl border border-success/25 bg-success-tint px-3.5 py-3 text-sm font-semibold text-success"
        role="status"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
        Correct — next question loaded.
      </p>
    );
  }
  if (feedback.kind === "SOCRATIC_HINT") {
    return (
      <div
        className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning-tint p-3.5 text-sm text-warning"
        role="status"
      >
        <MessagesSquare
          className="mt-0.5 h-5 w-5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="font-bold">Not quite — a hint is on its way.</p>
          <p className="mt-1 leading-6">
            Read the hint in the tutor panel, then try the same question again.
            The answer stays hidden until your second attempt.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Continuous practice: when a round completes the outcome is shown inline and,
 * for transitions that lead straight into another round (advance / reinforce /
 * rebuild), the next round is started automatically after a short beat. Only
 * terminal states (topic mastered, or a reroute to a prerequisite topic) stop
 * for an explicit choice. The engine still gets a clean round boundary to do
 * its competency math; the learner never has to click "continue".
 */
const CONTINUABLE_TRANSITIONS = new Set<LearningSessionTransition>([
  "ADVANCED",
  "REINFORCE",
  "DEMOTED",
  "NONE",
]);

function RoundOutcome({
  payload,
  feedback,
  missedItem,
  scope,
  loading,
  error,
  onContinue,
  onStop,
  onOpenFlashcards,
}: {
  payload: LearningSessionPayload;
  feedback: Feedback;
  missedItem: MissedItem;
  scope: LearningScope;
  loading: boolean;
  error: string | null;
  onContinue: () => void;
  onStop: () => void;
  onOpenFlashcards: () => void;
}) {
  const transition = payload.session.transition;
  const routed = Boolean(feedback?.route);
  const mastered = transition === "MASTERED";
  // A miss (REINFORCE/DEMOTED) normally auto-continues like a hit does, but
  // that only gives ~2s — not enough to actually use "try a similar one".
  // Pause auto-continue and require an explicit Continue once there's a
  // missed question to show; fall back to the old behaviour if it's somehow
  // unavailable so the round can never get stuck.
  const isMiss = isMissTransition(transition) && Boolean(missedItem);
  const continuable =
    !routed && !mastered && !isMiss && CONTINUABLE_TRANSITIONS.has(transition);
  const outcome = describeRoundOutcome(transition);
  const advancedRef = useRef(false);

  // `onContinue` is a fresh closure on every parent render (e.g. when the
  // dashboard refresh that fires on round completion resolves). Reading it from
  // a ref keeps the auto-continue effect's deps stable, so an unrelated
  // re-render can't cancel the pending timer and leave the round hanging.
  const onContinueRef = useRef(onContinue);
  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    if (!continuable || loading || advancedRef.current) return;
    advancedRef.current = true;
    const timer = window.setTimeout(() => onContinueRef.current(), 2000);
    return () => window.clearTimeout(timer);
  }, [continuable, loading]);

  const tone = outcome.tone;
  const Icon = mastered
    ? Trophy
    : transition === "ADVANCED"
      ? BadgeCheck
      : BookMarked;

  return (
    <div className="animate-fade flex flex-1 flex-col items-center justify-center px-4 text-center">
      <span
        className={`grid h-12 w-12 place-items-center rounded-2xl ${
          tone === "mastered"
            ? "bg-success-tint text-success"
            : tone === "rebuild"
              ? "bg-warning-tint text-warning"
              : "bg-primary-tint text-primary"
        }`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-3 font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
        {outcome.title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
        {outcome.detail}
      </p>

      {continuable ? (
        <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-ink-mute">
          <LoaderCircle
            className="h-3.5 w-3.5 animate-spin text-primary"
            aria-hidden="true"
          />
          {loading ? "Preparing the next round…" : "Continuing automatically…"}
        </p>
      ) : null}

      {isMiss && missedItem ? (
        <div className="mt-5 w-full max-w-md text-left">
          <p className="text-xs font-semibold text-ink-mute">
            {missedItem.bloomLevel} · {missedItem.difficulty}
          </p>
          <StudyMarkdown className="mt-1 text-sm font-semibold leading-6 text-ink">
            {missedItem.questionText}
          </StudyMarkdown>
          <TargetedPracticeCard
            reason="SIMILAR"
            focusText={missedItem.questionText}
            scope={scope}
            sourceQuestionId={missedItem.questionRefId}
            bloomLevel={missedItem.bloomLevel}
            difficulty={missedItem.difficulty}
            triggerLabel="Try a similar one"
          />
        </div>
      ) : null}

      {error ? (
        <p
          className="mt-4 flex max-w-md items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-3 py-2 text-left text-sm font-medium text-danger"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        {routed && feedback?.route ? (
          <Link
            href={learningUrl(feedback.route, { tab: "practice" })}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-strong"
          >
            Start {feedback.route.topic}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : mastered ? (
          <button
            type="button"
            onClick={onOpenFlashcards}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-strong"
          >
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            {outcome.continueLabel}
          </button>
        ) : continuable || isMiss ? (
          // Always available, so the learner can skip the short auto-continue
          // wait (or, on a miss, explicitly move on after reviewing/practising)
          // and can never be stranded if auto-continue does not fire.
          <button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Preparing…" : error ? "Try again" : "Continue now"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onStop}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-hairline px-4 py-2 text-sm font-bold text-ink-soft transition hover:bg-canvas"
        >
          Stop for now
        </button>
      </div>
    </div>
  );
}
function StartPanel({
  error,
  loading,
  onStart,
}: {
  error: string | null;
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-hairline bg-surface p-6 shadow-[0_18px_44px_rgba(20,20,30,0.07)] sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium text-ink-mute">
            <Target className="h-4 w-4" aria-hidden="true" />
            Practice
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink">
            Start the adaptive round
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            A short database-backed set opens with the live tutor beside it.
            Each question allows two attempts: a miss brings a hint first, never
            the answer. When the set completes, the next one is already
            prepared.
          </p>
          {error ? (
            <p
              className="mt-5 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-4 py-3 text-sm font-medium text-danger"
              role="alert"
            >
              <CircleAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          ) : null}
        </div>
        <div className="rounded-[1.35rem] border border-hairline bg-canvas p-4">
          <ol className="grid gap-2 text-sm font-semibold text-ink-soft">
            <li className="rounded-xl bg-surface px-3 py-3">
              1. Auto placement
            </li>
            <li className="rounded-xl bg-surface px-3 py-3">
              2. Answer with tutor support
            </li>
            <li className="rounded-xl bg-surface px-3 py-3">
              3. Continue sets until you stop
            </li>
            <li className="rounded-xl bg-surface px-3 py-3">
              4. Level moves only with evidence
            </li>
          </ol>
          <button
            type="button"
            onClick={onStart}
            disabled={loading}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.22)] transition hover:-translate-y-0.5 hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle
                className="h-5 w-5 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            Start adaptive practice
          </button>
        </div>
      </div>
    </section>
  );
}

function StartingSkeleton() {
  return (
    <section className="rounded-[1.5rem] border border-hairline bg-surface p-6 shadow-[0_18px_44px_rgba(20,20,30,0.07)] sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium text-ink-mute">
            <RefreshCw
              className="h-4 w-4 animate-spin text-primary"
              aria-hidden="true"
            />
            Preparing practice studio
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink">
            Building your next learning set
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            Selecting the right level, question set, and tutor context for this
            topic.
          </p>
        </div>
        <div className="rounded-[1.35rem] border border-hairline bg-canvas p-4">
          <div className="space-y-3" aria-label="Preparing adaptive practice">
            <div className="h-12 rounded-xl skeleton" />
            <div className="h-12 rounded-xl skeleton" />
            <div className="h-12 rounded-xl skeleton" />
            <div className="h-11 rounded-xl skeleton" />
          </div>
        </div>
      </div>
    </section>
  );
}
