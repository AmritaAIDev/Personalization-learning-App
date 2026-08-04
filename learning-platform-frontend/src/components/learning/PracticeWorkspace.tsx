'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookMarked,
  CheckCircle2,
  CircleAlert,
  Layers3,
  LoaderCircle,
  MessagesSquare,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { describeRoundOutcome, learningUrl } from '@/lib/learning';
import type {
  LearningAnswerPayload,
  LearningSessionPayload,
} from '@/lib/learning-types';
import StudyAssistant from './StudyAssistant';

type Feedback = LearningAnswerPayload['feedback'] | null;

export type PracticeWorkspaceProps = {
  payload: LearningSessionPayload | null;
  feedback: Feedback;
  loading: boolean;
  answering: boolean;
  error: string | null;
  onStart: () => void;
  onAnswer: (selectedOption: string) => void;
  onContinue: () => void;
  onStop: () => void;
  onOpenFlashcards: () => void;
};

const OPTION_KEYS = ['1', '2', '3', '4', '5', '6'];

export default function PracticeWorkspace({
  payload,
  feedback,
  loading,
  answering,
  error,
  onStart,
  onAnswer,
  onContinue,
  onStop,
  onOpenFlashcards,
}: PracticeWorkspaceProps) {
  if (!payload && loading) return <StartingSkeleton />;
  if (!payload) {
    return <StartPanel error={error} loading={loading} onStart={onStart} />;
  }

  const complete = payload.session.status !== 'ACTIVE';
  return (
    <div className="space-y-4 xl:flex xl:h-full xl:flex-col xl:overflow-hidden">
      <RoundHeader payload={payload} onOpenFlashcards={onOpenFlashcards} />

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)] xl:items-stretch">
        <section className="flex min-h-[32rem] flex-col rounded-[1.5rem] border border-hairline bg-surface p-4 shadow-[0_16px_40px_rgba(20,20,30,0.05)] sm:p-5 xl:min-h-0">
          {complete ? (
            <RoundSummary
              payload={payload}
              feedback={feedback}
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
              key={`${payload.currentItem?.id ?? 'none'}-${payload.currentItem?.attemptCount ?? 0}`}
              payload={payload}
              feedback={feedback}
              answering={answering}
              error={error}
              onAnswer={onAnswer}
            />
          )}
        </section>

        <div className="min-h-[32rem] xl:min-h-0">
          <StudyAssistant
            key={payload.session.id}
            sessionId={payload.session.id}
            autoOpenMessage={feedback?.assistantMessage ?? null}
            refreshWhen={feedback?.tutorPending ?? false}
            variant="panel"
            title="Linked tutor"
          />
        </div>
      </div>
    </div>
  );
}

function RoundHeader({
  payload,
  onOpenFlashcards,
}: {
  payload: LearningSessionPayload;
  onOpenFlashcards: () => void;
}) {
  const complete = payload.session.status !== 'ACTIVE';
  const answered = payload.progress.filter(
    (item) => item.status === 'RESOLVED',
  ).length;
  const progressPercent = complete
    ? 100
    : Math.round((answered / Math.max(1, payload.session.totalQuestions)) * 100);

  return (
    <section className="rounded-[1.35rem] border border-hairline bg-surface px-4 py-3 shadow-[0_12px_28px_rgba(20,20,30,0.045)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-mute">Adaptive signal</p>
          <p className="mt-1 truncate text-sm font-bold text-ink">
            {payload.placement.stageLabel} · {payload.session.coordinate.label} ·{' '}
            {payload.session.coordinate.bloomLevel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-ink px-3 py-2 text-white">
            {complete
              ? 'Round complete'
              : `Question ${Math.min(payload.session.currentSequence, payload.session.totalQuestions)}/${payload.session.totalQuestions}`}
          </span>
          <button
            type="button"
            onClick={onOpenFlashcards}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary-tint px-3 text-primary transition hover:bg-primary hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Flashcards
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-canvas"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Round progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex shrink-0 gap-1" aria-hidden="true">
          {payload.progress.map((item) => (
            <span
              key={item.id}
              title={`Question ${item.sequence}`}
              className={`h-2 w-2 rounded-full transition ${
                item.status === 'RESOLVED'
                  ? 'bg-primary'
                  : item.status === 'CURRENT'
                    ? 'bg-ink'
                    : 'bg-hairline'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ActiveQuestion({
  payload,
  feedback,
  answering,
  error,
  onAnswer,
}: {
  payload: LearningSessionPayload;
  feedback: Feedback;
  answering: boolean;
  error: string | null;
  onAnswer: (option: string) => void;
}) {
  const current = payload.currentItem;
  const [pendingOption, setPendingOption] = useState<string | null>(null);

  useEffect(() => {
    if (!current || answering) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
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
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answering, current, onAnswer]);

  if (!current) return null;

  const select = (option: string) => {
    if (answering || current.attemptedOptions.includes(option)) return;
    setPendingOption(option);
    onAnswer(option);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="rounded-full bg-primary-tint px-2.5 py-1 text-primary">
            {current.difficulty}
          </span>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-ink-soft">
            {current.bloomLevel}
          </span>
        </div>
        {current.requiresRetry ? (
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
            Second attempt · one option ruled out
          </span>
        ) : (
          <span className="text-xs font-medium text-ink-mute">
            Two attempts per question
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-[1.35rem] border border-hairline bg-canvas p-3 sm:p-4">
        <h2 className="font-heading text-lg font-bold leading-7 text-ink sm:text-xl sm:leading-8">
          {current.questionText}
        </h2>
        <div
          className="mt-4 space-y-2.5"
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
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                  ruledOut
                    ? 'border-hairline bg-surface text-ink-mute line-through opacity-60'
                    : pendingOption === option
                      ? 'border-primary bg-primary-tint text-primary-strong ring-1 ring-primary'
                      : 'border-hairline bg-surface text-ink hover:border-primary/45 hover:bg-primary-tint/40'
                } disabled:cursor-not-allowed`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                    pendingOption === option
                      ? 'bg-primary text-white'
                      : 'bg-canvas text-ink-mute'
                  }`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="flex-1">{option}</span>
                {isPending ? (
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
          Press 1–{current.options.length} to answer.
        </p>
      </div>

      <div className="mt-3 space-y-2" aria-live="polite">
        {answering ? (
          <p className="flex items-center gap-2 rounded-xl bg-primary-tint px-3 py-2.5 text-sm font-semibold text-primary-strong">
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
            className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            role="alert"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AnswerFeedback({
  feedback,
}: {
  feedback: NonNullable<Feedback>;
}) {
  if (feedback.kind === 'CORRECT') {
    return (
      <p
        className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-semibold text-emerald-800"
        role="status"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
        Correct — next question loaded.
      </p>
    );
  }
  if (feedback.kind === 'SOCRATIC_HINT') {
    return (
      <div
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"
        role="status"
      >
        <MessagesSquare className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
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

function RoundSummary({
  payload,
  feedback,
  loading,
  error,
  onContinue,
  onStop,
  onOpenFlashcards,
}: {
  payload: LearningSessionPayload;
  feedback: Feedback;
  loading: boolean;
  error: string | null;
  onContinue: () => void;
  onStop: () => void;
  onOpenFlashcards: () => void;
}) {
  const outcome = describeRoundOutcome(payload.session.transition);
  const answered = payload.progress.filter(
    (item) => item.status === 'RESOLVED',
  ).length;
  const firstTry = payload.progress.filter(
    (item) => item.status === 'RESOLVED' && item.attemptCount <= 1,
  ).length;

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span
        className={`grid h-14 w-14 place-items-center rounded-2xl ${
          outcome.tone === 'mastered'
            ? 'bg-emerald-100 text-emerald-700'
            : outcome.tone === 'rebuild'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-primary-tint text-primary'
        }`}
      >
        {outcome.tone === 'mastered' ? (
          <Trophy className="h-7 w-7" aria-hidden="true" />
        ) : payload.session.transition === 'ADVANCED' ? (
          <BadgeCheck className="h-7 w-7" aria-hidden="true" />
        ) : (
          <BookMarked className="h-7 w-7" aria-hidden="true" />
        )}
      </span>
      <p className="mt-6 text-xs font-medium text-ink-mute">Adaptive checkpoint</p>
      <h3 className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink">
        {outcome.title}
      </h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        {outcome.detail}
      </p>

      <dl className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2">
        <div className="rounded-2xl bg-canvas px-3 py-3">
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
            Questions cleared
          </dt>
          <dd className="mt-1 font-heading text-xl font-bold text-ink">
            {answered}/{payload.session.totalQuestions}
          </dd>
        </div>
        <div className="rounded-2xl bg-canvas px-3 py-3">
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
            First-attempt wins
          </dt>
          <dd className="mt-1 font-heading text-xl font-bold text-ink">
            {firstTry}
          </dd>
        </div>
      </dl>

      {/* A failed "continue" must be visible here, not only on the start panel. */}
      {error ? (
        <p
          className="mt-6 flex max-w-xl items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        {feedback?.route ? (
          <Link
            href={learningUrl(feedback.route, { tab: 'practice' })}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.22)] transition hover:bg-primary-strong"
          >
            Start {feedback.route.topic}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : payload.session.transition === 'MASTERED' ? (
          <button
            type="button"
            onClick={onOpenFlashcards}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.22)] transition hover:bg-primary-strong"
          >
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            {outcome.continueLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.22)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {loading ? 'Preparing next set' : outcome.continueLabel}
            {loading ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
        <button
          type="button"
          onClick={onStop}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-hairline px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-canvas"
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
            A short database-backed set opens with the live tutor beside it. Each
            question allows two attempts: a miss brings a hint first, never the
            answer. When the set completes, the next one is already prepared.
          </p>
          {error ? (
            <p
              className="mt-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              role="alert"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </div>
        <div className="rounded-[1.35rem] border border-hairline bg-canvas p-4">
          <ol className="grid gap-2 text-sm font-semibold text-ink-soft">
            <li className="rounded-xl bg-surface px-3 py-3">1. Auto placement</li>
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
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
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
            <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
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
