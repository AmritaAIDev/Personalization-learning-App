'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookMarked,
  CheckCircle2,
  CircleAlert,
  Compass,
  Layers3,
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
      return 'Next checkpoint unlocked.';
    case 'PREREQUISITE':
      return 'A foundation route is better now.';
    case 'DEMOTED':
      return 'The system is rebuilding the base.';
    case 'REINFORCE':
      return 'One focused reinforcement round is ready.';
    default:
      return 'This learning round is complete.';
  }
}

function transitionDetail(payload: LearningSessionPayload) {
  switch (payload.session.transition) {
    case 'MASTERED':
      return 'The topic route is complete. Keep it durable with quick flashcard review.';
    case 'ADVANCED':
      return 'Your recent answers give enough evidence to move to the next checkpoint.';
    case 'PREREQUISITE':
      return 'A supporting idea should be strengthened first so this topic becomes easier.';
    case 'DEMOTED':
      return 'The next round steps back only enough to rebuild accuracy and confidence.';
    case 'REINFORCE':
      return 'The same idea needs one tighter pass before the level changes.';
    default:
      return 'Your answers are saved and the next recommended checkpoint is ready.';
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
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition duration-200 ${
        active
          ? 'border-[#e31540] bg-[#fff3f6] text-[#a61231] shadow-[0_8px_20px_rgba(227,21,64,0.08)]'
          : 'border-[#e7e1e3] bg-white text-[#55585f] hover:-translate-y-0.5 hover:border-[#e31540]/30 hover:bg-[#fffafb]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]" aria-label="Loading topic dashboard">
      <div className="rounded-[1.5rem] border border-[#eee7e9] bg-white p-5 shadow-[0_14px_34px_rgba(49,51,55,0.05)]">
        <div className="h-3 w-28 animate-pulse rounded-full bg-[#f1ecee]" />
        <div className="mt-5 h-8 w-64 animate-pulse rounded-full bg-[#f1ecee]" />
        <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-[#f1ecee]" />
        <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-[#f1ecee]" />
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-[#f7f4f5]" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-[1.5rem] border border-[#eee7e9] bg-white" />
        <div className="h-40 animate-pulse rounded-[1.5rem] border border-[#eee7e9] bg-white" />
      </div>
    </div>
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
  const status =
    topicState?.status === 'MASTERED'
      ? 'Mastered'
      : topicState?.status === 'PAUSED_FOR_PREREQUISITE'
        ? 'Foundation needed'
        : topicState
          ? 'In progress'
          : 'Ready to place';

  return (
    <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
      <section className="rounded-[1.5rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_14px_34px_rgba(49,51,55,0.05)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e31540]">
              <SearchCheck className="h-4 w-4" aria-hidden="true" />
              Current route
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#313337]">
              {topicState ? topicState.stageLabel : 'Start placement through practice'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6e75]">
              {topicState
                ? topicState.nextFocus
                : 'The system will place the student automatically from the first adaptive round.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPractice}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.18)] transition hover:-translate-y-0.5 hover:bg-[#c61137]"
          >
            Continue practice
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f1ecee]">
          <div
            className="h-full rounded-full bg-[#e31540] transition-all duration-500"
            style={{ width: `${topicState?.masteryPercent ?? 0}%` }}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ['Route', `${topicState?.masteryPercent ?? 0}% complete`],
            ['Accuracy', accuracy === null ? 'No answers yet' : `${accuracy}%`],
            ['Status', status],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#eee7e9] bg-[#fbfafb] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8f939b]">
                {label}
              </p>
              <p className="mt-2 text-sm font-bold text-[#313337]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <article className="rounded-[1.5rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_14px_34px_rgba(49,51,55,0.05)]">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e31540]">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            Topic trail
          </p>
          {history.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-[#f7f4f5] p-4 text-sm leading-6 text-[#6b6e75]">
              No saved checkpoint yet. Finish one short practice round to build history.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {history.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee7e9] bg-[#fbfafb] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-[#313337]">
                      {item.coordinate.label}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6b6e75]">
                      {item.transition.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#8f939b]">
                    L{item.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-[1.5rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_14px_34px_rgba(49,51,55,0.05)]">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e31540]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Suggested next
          </p>
          {suggestions.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[#6b6e75]">
              Suggestions will appear after more completed activity.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {suggestions.slice(0, 3).map((item) => (
                <Link
                  key={`${item.subject}-${item.chapter}-${item.topic}`}
                  href={learningUrl(item, { tab: 'overview' })}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-[#eee7e9] bg-[#fbfafb] px-4 py-3 transition hover:border-[#e31540]/35 hover:bg-[#fff5f7]"
                >
                  <div>
                    <p className="text-sm font-bold text-[#313337]">{item.topic}</p>
                    <p className="mt-0.5 text-xs leading-5 text-[#6b6e75]">
                      {item.reason}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#e31540] transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function FlashcardsWorkspace({ scope }: { scope: LearningScope }) {
  return <FlashcardDeck scope={scope} />;
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
  onStop,
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
  onStop: () => void;
}) {
  if (!payload) {
    return (
      <section className="rounded-[1.5rem] border border-[#e7dfe1] bg-white p-6 shadow-[0_18px_44px_rgba(49,51,55,0.07)] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e31540]">
              <Target className="h-4 w-4" aria-hidden="true" />
              Practice
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#313337]">
              Start the adaptive round
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b6e75]">
              Five database-backed questions open the live tutor flow. The student does not pick a level manually.
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
          <div className="rounded-[1.35rem] border border-[#eee7e9] bg-[#fbfafb] p-4">
            <div className="grid gap-2 text-sm font-semibold text-[#55585f]">
              <span className="rounded-xl bg-white px-3 py-3">1. Auto placement</span>
              <span className="rounded-xl bg-white px-3 py-3">2. Answer with tutor support</span>
              <span className="rounded-xl bg-white px-3 py-3">3. Level updates only with evidence</span>
            </div>
            <button
              type="button"
              onClick={onStart}
              disabled={loading}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e31540] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.22)] transition hover:-translate-y-0.5 hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              Start adaptive practice
            </button>
          </div>
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
    <div className="space-y-5">
      <section className="rounded-[1.35rem] border border-[#e8e1e3] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(49,51,55,0.045)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e31540]">
              Adaptive signal
            </p>
            <p className="mt-1 text-sm font-bold text-[#313337]">
              {payload.placement.stageLabel} - {payload.session.coordinate.label}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#fff3f6] px-3 py-2 text-[#a61231]">
              {payload.placement.confidence} confidence
            </span>
            <span className="rounded-full bg-[#f4f5f7] px-3 py-2 text-[#55585f]">
              {payload.state.masteryPercent}% topic route
            </span>
            <span className="rounded-full bg-[#313337] px-3 py-2 text-white">
              {complete
                ? 'Round complete'
                : `Question ${payload.session.currentSequence}/${payload.session.totalQuestions}`}
            </span>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f1ecee]">
          <div
            className="h-full rounded-full bg-[#e31540] transition-all duration-500"
            style={{ width: `${complete ? 100 : progressPercent}%` }}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.95fr)] xl:items-stretch">
        <section className="flex min-h-[38rem] flex-col rounded-[1.5rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_16px_40px_rgba(49,51,55,0.05)] sm:p-6">
          {complete ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl ${
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
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#e31540]">
                Adaptive checkpoint
              </p>
              <h3 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#313337]">
                {transitionTitle(payload)}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#6b6e75]">
                {transitionDetail(payload)}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                {feedback?.route ? (
                  <Link
                    href={learningUrl(feedback.route, { tab: 'practice' })}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Start {feedback.route.topic}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : payload.session.transition === 'MASTERED' ? null : (
                  <button
                    type="button"
                    onClick={onContinue}
                    disabled={loading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137]"
                  >
                    {loading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    Continue next round
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onStop}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dcdde0] px-5 py-2.5 text-sm font-bold text-[#55585f] transition hover:bg-[#f7f4f5]"
                >
                  Stop for now
                </button>
                <Link
                  href={learningUrl(scope, { tab: 'flashcards' })}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dcdde0] px-5 py-2.5 text-sm font-bold text-[#55585f] transition hover:bg-[#f7f4f5]"
                >
                  Review flashcards
                </Link>
              </div>
            </div>
          ) : current ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e31540]">
                    Question card
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#6b6e75]">
                    Choose an answer. The tutor responds from this exact attempt.
                  </p>
                </div>
                {current.requiresRetry ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                    Retry with hint
                  </span>
                ) : null}
              </div>
              <div className="rounded-[1.35rem] border border-[#eee7e9] bg-[#fbfafb] p-3">
                <QuestionCard
                  questionText={current.questionText}
                  options={current.options}
                  disabled={answering}
                  onSelect={(option) => onAnswer(option)}
                />
              </div>
              {answering ? (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#fff5f7] px-4 py-3 text-sm font-semibold text-[#a61231]">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#e31540]" aria-hidden="true" />
                  Checking your reasoning...
                </p>
              ) : null}
              {feedback ? (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 text-sm ${
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
                        ? 'Hint ready in the tutor.'
                        : feedback.kind === 'CORRECT'
                          ? 'Correct.'
                          : 'Route updated.'}
                    </p>
                    <p className="mt-1 leading-6">
                      {feedback.kind === 'SOCRATIC_HINT'
                        ? 'Read the linked explanation, then try the same checkpoint again.'
                        : 'The assistant has the context if you want a deeper explanation.'}
                    </p>
                  </div>
                </div>
              ) : null}
              {error ? (
                <p
                  className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                  role="alert"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="min-h-[38rem]">
          <StudyAssistant
            key={payload.session.id}
            sessionId={payload.session.id}
            autoOpenMessage={feedback?.assistantMessage ?? null}
            variant="panel"
            title="Linked tutor"
          />
        </div>
      </div>
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

  const refreshDashboard = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setDashboardLoading(true);
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
      if (showSkeleton) setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPayload(null);
      setFeedback(null);
      setError(null);
      setActiveTab(initialTab);
      void refreshDashboard(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [initialTab, refreshDashboard, scope.chapter, scope.subject, scope.topic]);

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
      void refreshDashboard(false);
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
      if (next.session.status !== 'ACTIVE') void refreshDashboard(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Your answer could not be checked.',
      );
    } finally {
      setAnswering(false);
    }
  };

  const stopPractice = () => {
    setPayload(null);
    setFeedback(null);
    setError(null);
    setActiveTab('overview');
  };

  const topicState = getTopicState(dashboard, scope);

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <header className="rounded-[1.5rem] border border-[#e7dfe1] bg-white px-4 py-4 shadow-[0_16px_38px_rgba(49,51,55,0.06)] sm:px-5">
        <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <Link
            href="/"
            className="inline-flex min-h-9 w-fit items-center justify-center gap-2 rounded-xl border border-[#dcdde0] px-3 py-1.5 text-xs font-bold text-[#55585f] transition hover:bg-[#f7f4f5]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Search
          </Link>

          <div className="text-left lg:text-center">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e31540]">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Topic workspace
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#313337] sm:text-3xl">
              {scope.topic}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 lg:justify-center">
              <span className="rounded-full bg-[#f4f5f7] px-3 py-1.5 text-xs font-bold text-[#55585f]">
                {scope.chapter}
              </span>
              <span className="rounded-full bg-[#fff3f6] px-3 py-1.5 text-xs font-bold text-[#a61231]">
                {topicState?.stageLabel ?? 'Placement pending'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <TabButton
              active={activeTab === 'overview'}
              label="Dashboard"
              icon={<SearchCheck className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setActiveTab('overview')}
            />
            <TabButton
              active={activeTab === 'flashcards'}
              label="Flashcards"
              icon={<BookMarked className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setActiveTab('flashcards')}
            />
            <TabButton
              active={activeTab === 'practice'}
              label="Practice"
              icon={<MessagesSquare className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setActiveTab('practice')}
            />
          </div>
        </div>
      </header>

      {dashboardError && activeTab === 'overview' ? (
        <p
          className="mt-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {dashboardError}
        </p>
      ) : null}

      <div className="mt-6">
        {activeTab === 'overview' ? (
          dashboardLoading ? (
            <DashboardSkeleton />
          ) : (
            <TopicOverview
              scope={scope}
              topicState={topicState}
              dashboard={dashboard}
              onOpenPractice={() => setActiveTab('practice')}
            />
          )
        ) : activeTab === 'flashcards' ? (
          <FlashcardsWorkspace scope={scope} />
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
            onContinue={() => void start()}
            onStop={stopPractice}
          />
        )}
      </div>
    </div>
  );
}
