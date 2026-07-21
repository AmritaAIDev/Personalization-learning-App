'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookMarked,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Compass,
  Layers3,
  LibraryBig,
  LoaderCircle,
  MessagesSquare,
  SearchCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import QuestionCard from '@/components/QuestionCard';
import { apiFetch } from '@/lib/api';
import { learningUrl } from '@/lib/learning';
import type {
  LearningAnswerPayload,
  LearningDashboardPayload,
  LearningScope,
  LearningSessionPayload,
  LearningState,
  LearningTab,
} from '@/lib/learning-types';
import FlashcardDeck from './FlashcardDeck';
import StudyAssistant from './StudyAssistant';

function transitionTitle(payload: LearningSessionPayload) {
  switch (payload.session.transition) {
    case 'MASTERED':
      return 'Topic mastered.';
    case 'ADVANCED':
      return 'You are ready for the next challenge.';
    case 'PREREQUISITE':
      return 'A foundation topic should come first.';
    case 'DEMOTED':
      return 'The system is reinforcing a lower checkpoint.';
    case 'REINFORCE':
      return 'One more focused round is ready.';
    default:
      return 'This learning round is complete.';
  }
}

function transitionDetail(payload: LearningSessionPayload) {
  switch (payload.session.transition) {
    case 'MASTERED':
      return 'You completed this topic route. Keep it durable with review, flashcards, and a balanced quiz set.';
    case 'ADVANCED':
      return 'Your next checkpoint has been prepared from your recent performance so you can keep momentum without guessing where to go next.';
    case 'PREREQUISITE':
      return 'The system detected a foundation gap and is redirecting you to the topic that will help this one make sense.';
    case 'DEMOTED':
      return 'Your next round will step back just enough to rebuild confidence and understanding before you move up again.';
    case 'REINFORCE':
      return 'A tighter follow-up round is ready so the same idea can be reinforced before progression continues.';
    default:
      return 'Your progress is saved and the next recommended checkpoint is ready when you are.';
  }
}

function getTopicState(
  dashboard: LearningDashboardPayload | null,
  scope: LearningScope,
): LearningState | null {
  if (!dashboard) return null;
  return (
    dashboard.activeTopics.find(
      (topic) =>
        topic.subject === scope.subject &&
        topic.chapter === scope.chapter &&
        topic.topic === scope.topic,
    ) ??
    dashboard.completedTopics.find(
      (topic) =>
        topic.subject === scope.subject &&
        topic.chapter === scope.chapter &&
        topic.topic === scope.topic,
    ) ??
    null
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
        active
          ? 'border-[#e31540] bg-[#fff5f7] text-[#a61231] shadow-[0_10px_22px_rgba(227,21,64,0.08)]'
          : 'border-[#e7e1e3] bg-white text-[#55585f] hover:border-[#e31540]/30 hover:bg-[#fffafb]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TopicOverview({
  scope,
  topicState,
  dashboard,
  onOpenPractice,
}: {
  scope: LearningScope;
  topicState: LearningState | null;
  dashboard: LearningDashboardPayload | null;
  onOpenPractice: () => void;
}) {
  const history =
    dashboard?.history.filter(
      (item) =>
        item.subject === scope.subject &&
        item.chapter === scope.chapter &&
        item.topic === scope.topic,
    ) ?? [];
  const suggestions =
    dashboard?.suggestions.filter((item) => item.topic !== scope.topic) ?? [];
  const accuracy =
    topicState && topicState.totalAnswered > 0
      ? Math.round((topicState.totalCorrect / topicState.totalAnswered) * 100)
      : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[1.85rem] border border-[#e8e1e3] bg-white p-6 shadow-[0_16px_40px_rgba(49,51,55,0.05)]">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
          <SearchCheck className="h-4 w-4" aria-hidden="true" />
          Learning dashboard
        </p>
        <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#313337]">
          {topicState ? topicState.stageLabel : 'Ready to begin'}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b6e75]">
          {topicState ? topicState.nextFocus : 'Start a focused round when you are ready.'}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f7f4f5] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f939b]">
              Current standing
            </p>
            <p className="mt-2 font-heading text-2xl font-bold text-[#313337]">
              {topicState?.stageLabel ?? 'Not placed yet'}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#6b6e75]">
              {topicState
                ? `${topicState.masteryPercent}% route complete`
                : 'No active round yet.'}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f7f4f5] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f939b]">
              Accuracy signal
            </p>
            <p className="mt-2 font-heading text-2xl font-bold text-[#313337]">
              {accuracy === null ? '—' : `${accuracy}%`}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#6b6e75]">
              {topicState
                ? `${topicState.totalCorrect} correct from ${topicState.totalAnswered} submitted answers`
                : 'No answers yet.'}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f7f4f5] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f939b]">
              Status
            </p>
            <p className="mt-2 font-heading text-2xl font-bold text-[#313337]">
              {topicState?.status === 'MASTERED'
                ? 'Mastered'
                : topicState?.status === 'PAUSED_FOR_PREREQUISITE'
                  ? 'Needs foundation'
                  : topicState
                    ? 'In progress'
                    : 'Ready'}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#6b6e75]">
              {topicState ? `Last activity saved for ${scope.topic}.` : 'Ready to begin.'}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[#ece6e8] bg-[#fffafb] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e31540]">
                Recommended next move
              </p>
              <h3 className="mt-1 text-base font-bold text-[#313337]">
                Continue practice
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenPractice}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137]"
            >
              Open practice
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <article className="rounded-[1.85rem] border border-[#e8e1e3] bg-white p-6 shadow-[0_16px_40px_rgba(49,51,55,0.05)]">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            Topic history
          </p>
          {history.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[#6b6e75]">
              No checkpoints yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {history.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#ece6e8] bg-[#fbfafb] p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8f939b]">
                    {new Date(item.completedAt ?? '').toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#313337]">
                    {item.coordinate.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#6b6e75]">
                    Transition: {item.transition.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-[1.85rem] bg-[#313337] p-6 text-white shadow-[0_16px_34px_rgba(49,51,55,0.15)]">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f7b9c8]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Suggested next topics
          </p>
          {suggestions.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[#d6d7da]">
              No suggestions yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {suggestions.slice(0, 3).map((item) => (
                <Link
                  key={`${item.subject}-${item.chapter}-${item.topic}`}
                  href={learningUrl(item, { tab: 'overview' })}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <p className="text-sm font-bold">{item.topic}</p>
                  <p className="mt-1 text-xs leading-5 text-[#d6d7da]">
                    {item.reason}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function ReviewWorkspace({
  scope,
  onOpenPractice,
}: {
  scope: LearningScope;
  onOpenPractice: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[1.85rem] border border-[#e8e1e3] bg-white p-6 shadow-[0_16px_40px_rgba(49,51,55,0.05)]">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
          <LibraryBig className="h-4 w-4" aria-hidden="true" />
          Quiz and revision
        </p>
        <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#313337]">
          Review
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#6b6e75]">
          Flashcards and quiz sets for this topic.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-[#ece6e8] bg-[#fbfafb] p-5">
            <p className="text-sm font-bold text-[#313337]">Flashcards</p>
            <p className="mt-2 text-sm leading-6 text-[#6b6e75]">
              Formulas, definitions, and quick recall.
            </p>
          </div>
          <div className="rounded-2xl border border-[#ece6e8] bg-[#fbfafb] p-5">
            <p className="text-sm font-bold text-[#313337]">Reviewed quiz sets</p>
            <p className="mt-2 text-sm leading-6 text-[#6b6e75]">
              A broader check for this topic.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/arena"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d9dadd] px-4 py-2 text-sm font-bold text-[#55585f] transition hover:bg-[#f7f4f5]"
              >
                Open quiz arena
              </Link>
              <button
                type="button"
                onClick={onOpenPractice}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#c61137]"
              >
                Back to practice
              </button>
            </div>
          </div>
        </div>
      </section>

      <FlashcardDeck scope={scope} />
    </div>
  );
}

function PracticeWorkspace({
  scope,
  payload,
  feedback,
  loading,
  answering,
  error,
  onStart,
  onAnswer,
  onContinue,
}: {
  scope: LearningScope;
  payload: LearningSessionPayload | null;
  feedback: LearningAnswerPayload['feedback'] | null;
  loading: boolean;
  answering: boolean;
  error: string | null;
  onStart: () => void;
  onAnswer: (selectedOption: string) => void;
  onContinue: () => void;
}) {
  if (!payload) {
    return (
      <section className="rounded-[2rem] border border-[#e7dfe1] bg-white p-6 shadow-[0_20px_50px_rgba(49,51,55,0.08)] sm:p-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
          <Target className="h-4 w-4" aria-hidden="true" />
          Practice studio
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-[#313337]">
          Practice studio
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b6e75]">
          Start a focused round for this topic.
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
        <div className="mt-7">
          <button
            type="button"
            onClick={onStart}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            Start adaptive practice
          </button>
        </div>
      </section>
    );
  }

  const complete = payload.session.status !== 'ACTIVE';
  const current = payload.currentItem;
  const progressPercent = Math.round(
    ((payload.session.currentSequence - 1) / payload.session.totalQuestions) * 100,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_24rem]">
      <main>
        <section className="rounded-[1.85rem] border border-[#e8e1e3] bg-white p-6 shadow-[0_16px_40px_rgba(49,51,55,0.05)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
                <BrainCircuit className="h-4 w-4" aria-hidden="true" />
                Practice studio
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#313337]">
                {scope.topic}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 self-start text-xs font-bold">
              <span className="rounded-full bg-[#f9e5ea] px-3 py-2 text-[#a61231]">
                {payload.placement.stageLabel}
              </span>
              <span className="rounded-full bg-[#f4f5f7] px-3 py-2 text-[#55585f]">
                {payload.session.coordinate.label}
              </span>
              <span className="rounded-full bg-[#313337] px-3 py-2 text-white">
                {payload.placement.confidence} confidence
              </span>
            </div>
          </div>

          <div
            className="mt-6 h-2 overflow-hidden rounded-full bg-[#ece7e8]"
            aria-label={`${progressPercent}% of this round complete`}
          >
            <div
              className="h-full rounded-full bg-[#e31540] transition-all"
              style={{ width: `${complete ? 100 : progressPercent}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[#6b6e75]">
            <span>
              {complete
                ? 'Round complete'
                : `Question ${payload.session.currentSequence} of ${payload.session.totalQuestions}`}
            </span>
            <span>{payload.state.masteryPercent}% topic route complete</span>
          </div>
        </section>

        {complete ? (
          <section className="mt-6 rounded-[1.85rem] border border-[#e7dfe1] bg-white p-6 text-center shadow-[0_18px_45px_rgba(49,51,55,0.07)] sm:p-8">
            <span
              className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${
                payload.session.transition === 'MASTERED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : payload.session.transition === 'PREREQUISITE' ||
                      payload.session.transition === 'DEMOTED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-[#f9e5ea] text-[#e31540]'
              }`}
            >
              {payload.session.transition === 'MASTERED' ? (
                <Trophy className="h-7 w-7" aria-hidden="true" />
              ) : payload.session.transition === 'ADVANCED' ? (
                <BadgeCheck className="h-7 w-7" aria-hidden="true" />
              ) : (
                <BookMarked className="h-7 w-7" aria-hidden="true" />
              )}
            </span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
              Adaptive checkpoint
            </p>
            <h3 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#313337]">
              {transitionTitle(payload)}
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#6b6e75]">
              {transitionDetail(payload)}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              {feedback?.route ? (
                <Link
                  href={learningUrl(feedback.route, { tab: 'practice' })}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137]"
                >
                  Start {feedback.route.topic}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onContinue}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137]"
                >
                  Continue practice
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <Link
                href={learningUrl(scope, { tab: 'review' })}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dcdde0] px-5 py-2.5 text-sm font-bold text-[#55585f] transition hover:bg-[#f7f4f5]"
              >
                Go to review
              </Link>
            </div>
          </section>
        ) : current ? (
          <section className="mt-6 rounded-[1.85rem] border border-[#e8e1e3] bg-white p-6 shadow-[0_16px_40px_rgba(49,51,55,0.05)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#6b6e75]">
                Solve first from your own reasoning.
              </p>
              {current.requiresRetry ? (
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                  Retry with the new hint
                </span>
              ) : null}
            </div>
            <QuestionCard
              questionText={current.questionText}
              options={current.options}
              disabled={answering}
              onSelect={(option) => onAnswer(option)}
            />
            {answering ? (
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#6b6e75]">
                <LoaderCircle className="h-4 w-4 animate-spin text-[#e31540]" aria-hidden="true" />
                Checking your reasoning…
              </p>
            ) : null}
            {feedback ? (
              <div
                className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                  feedback.kind === 'SOCRATIC_HINT'
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : feedback.kind === 'CORRECT'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-[#efc3ce] bg-[#fff5f7] text-[#8d1730]'
                }`}
                role="status"
              >
                {feedback.kind === 'CORRECT' ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                ) : (
                  <MessagesSquare className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                )}
                <div>
                  <p className="font-bold">
                    {feedback.kind === 'SOCRATIC_HINT'
                      ? 'Hint ready.'
                      : feedback.kind === 'CORRECT'
                        ? 'Correct.'
                        : 'Progress updated.'}
                  </p>
                  <p className="mt-1 leading-6">
                    {feedback.kind === 'SOCRATIC_HINT'
                      ? 'Try the question once more after reviewing it.'
                      : 'Keep going when you are ready.'}
                  </p>
                </div>
              </div>
            ) : null}
            {error ? (
              <p
                className="mt-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                role="alert"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}
          </section>
        ) : null}
      </main>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-[1.85rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_14px_34px_rgba(49,51,55,0.05)]">
          <h3 className="font-heading text-lg font-bold text-[#313337]">
            Current learning signal
          </h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl bg-[#f7f4f5] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f939b]">
                Stage
              </p>
              <p className="mt-2 font-bold text-[#313337]">
                {payload.placement.stageLabel}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f7f4f5] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f939b]">
                Next focus
              </p>
              <p className="mt-2 leading-6 text-[#55585f]">
                {payload.placement.nextFocus}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f7f4f5] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f939b]">
                Topic route
              </p>
            <p className="mt-2 leading-6 text-[#55585f]">
                {payload.state.masteryPercent}% complete.
              </p>
            </div>
          </div>
        </section>

        <StudyAssistant
          key={payload.session.id}
          sessionId={payload.session.id}
          autoOpenMessage={feedback?.assistantMessage ?? null}
          variant="panel"
          title="Linked tutor"
        />
      </aside>
    </div>
  );
}

export default function AdaptiveStudySession({
  scope,
  initialTab,
}: {
  scope: LearningScope;
  initialTab: LearningTab;
}) {
  const [activeTab, setActiveTab] = useState<LearningTab>(initialTab);
  const [payload, setPayload] = useState<LearningSessionPayload | null>(null);
  const [feedback, setFeedback] = useState<LearningAnswerPayload['feedback'] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<LearningDashboardPayload | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setDashboardLoading(true);
      try {
        const next = await apiFetch<LearningDashboardPayload>('/api/learning/dashboard');
        setDashboard(next);
        setDashboardError(null);
      } catch (reason) {
        setDashboardError(
          reason instanceof Error
            ? reason.message
            : 'The topic dashboard could not be loaded.',
        );
      } finally {
        setDashboardLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [scope.chapter, scope.subject, scope.topic]);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await apiFetch<LearningSessionPayload>('/api/learning/sessions', {
        method: 'POST',
        body: JSON.stringify(scope),
      });
      setPayload(next);
      setFeedback(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The learning journey could not be opened.',
      );
    } finally {
      setLoading(false);
    }
  };

  const answer = async (selectedOption: string) => {
    if (!payload?.currentItem || answering) return;
    setAnswering(true);
    setError(null);
    try {
      const next = await apiFetch<LearningAnswerPayload>(
        `/api/learning/sessions/${payload.session.id}/items/${payload.currentItem.id}/answer`,
        {
          method: 'POST',
          body: JSON.stringify({ selectedOption }),
        },
      );
      setPayload(next);
      setFeedback(next.feedback);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Your answer could not be checked.',
      );
    } finally {
      setAnswering(false);
    }
  };

  const restart = () => {
    setPayload(null);
    setFeedback(null);
    setError(null);
  };

  const topicState = getTopicState(dashboard, scope);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <header className="rounded-[2rem] border border-[#e7dfe1] bg-white p-6 shadow-[0_20px_50px_rgba(49,51,55,0.08)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Topic workspace
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#313337] sm:text-4xl">
              {scope.topic}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6b6e75]">
              Progress, review, and practice for this topic.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start text-xs font-bold">
            <span className="rounded-full bg-[#f4f5f7] px-3 py-2 text-[#55585f]">
              {scope.chapter}
            </span>
            {topicState ? (
              <span className="rounded-full bg-[#f9e5ea] px-3 py-2 text-[#a61231]">
                {topicState.stageLabel}
              </span>
            ) : (
              <span className="rounded-full bg-[#f9e5ea] px-3 py-2 text-[#a61231]">
                Placement pending
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <TabButton
            active={activeTab === 'overview'}
            label="Dashboard"
            icon={<SearchCheck className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            active={activeTab === 'review'}
            label="Quizzes & flashcards"
            icon={<LibraryBig className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setActiveTab('review')}
          />
          <TabButton
            active={activeTab === 'practice'}
            label="Practice studio"
            icon={<MessagesSquare className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setActiveTab('practice')}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dcdde0] px-4 py-2 text-sm font-bold text-[#55585f] transition hover:bg-[#f7f4f5]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to search
          </Link>
          {activeTab !== 'practice' ? (
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#c61137]"
            >
              Open practice studio
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </header>

      {dashboardError && activeTab === 'overview' ? (
        <p
          className="mt-6 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {dashboardError}
        </p>
      ) : null}

      <div className="mt-7">
        {activeTab === 'overview' ? (
          dashboardLoading ? (
            <div className="grid min-h-52 place-items-center rounded-[1.85rem] border border-[#e8e1e3] bg-white text-sm font-semibold text-[#6b6e75] shadow-[0_14px_34px_rgba(49,51,55,0.05)]">
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin text-[#e31540]" aria-hidden="true" />
                Loading topic dashboard
              </span>
            </div>
          ) : (
            <TopicOverview
              scope={scope}
              topicState={topicState}
              dashboard={dashboard}
              onOpenPractice={() => setActiveTab('practice')}
            />
          )
        ) : activeTab === 'review' ? (
          <ReviewWorkspace
            scope={scope}
            onOpenPractice={() => setActiveTab('practice')}
          />
        ) : (
          <PracticeWorkspace
            scope={scope}
            payload={payload}
            feedback={feedback}
            loading={loading}
            answering={answering}
            error={error}
            onStart={() => void start()}
            onAnswer={(selectedOption) => void answer(selectedOption)}
            onContinue={restart}
          />
        )}
      </div>
    </div>
  );
}
