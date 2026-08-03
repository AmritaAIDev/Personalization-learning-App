'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
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
  RefreshCw,
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
import SubtopicExplorer from './SubtopicExplorer';

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

function formatTransitionLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]" aria-label="Loading topic dashboard">
      <div className="rounded-[1.5rem] border border-[#ececf0] bg-white p-5 shadow-[0_14px_34px_rgba(20, 20, 30,0.05)]">
        <div className="h-3 w-28 animate-pulse rounded-full bg-[#f2f2f5]" />
        <div className="mt-5 h-8 w-64 animate-pulse rounded-full bg-[#f2f2f5]" />
        <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-[#f2f2f5]" />
        <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-[#f2f2f5]" />
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-[#f4f4f6]" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-[1.5rem] border border-[#ececf0] bg-white" />
        <div className="h-40 animate-pulse rounded-[1.5rem] border border-[#ececf0] bg-white" />
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
  const coordinate = topicState?.currentCoordinate;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <section className="overflow-hidden rounded-[1.75rem] border border-[#e2ece6] bg-white shadow-[0_16px_38px_rgba(20,20,30,0.06)]">
          <div className="border-b border-[#e6efe9] bg-[linear-gradient(135deg,#f5faf7_0%,#ffffff_62%)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
                <SearchCheck className="h-4 w-4" aria-hidden="true" />
                Current learning route
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#1a1a1f]">
                {topicState ? topicState.stageLabel : 'Start placement through practice'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenPractice}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#3f6f57] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20, 20, 30,0.18)] transition hover:-translate-y-0.5 hover:bg-[#315844]"
            >
              Continue practice
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f2f2f5]">
            <div
              className="h-full rounded-full bg-[#3f6f57] transition-all duration-500"
              style={{ width: `${topicState?.masteryPercent ?? 0}%` }}
            />
          </div>
          </div>
          <dl className="grid divide-y divide-[#e6efe9] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4 sm:px-6">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">Mastery</dt>
              <dd className="mt-1 font-heading text-xl font-bold text-ink">{topicState?.masteryPercent ?? 0}%</dd>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">Accuracy</dt>
              <dd className="mt-1 font-heading text-xl font-bold text-ink">{accuracy === null ? '—' : `${accuracy}%`}</dd>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">Checkpoint</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-ink">
                <span>{coordinate ? `Level ${topicState?.currentLevel}` : 'Not placed'}</span>
                <span className="text-ink-mute">{coordinate ? `${coordinate.bloomLevel} · ${coordinate.difficulty}` : status}</span>
              </dd>
            </div>
          </dl>
        </section>

      <section className="space-y-5">
        <article className="rounded-[1.5rem] border border-[#ececf0] bg-white p-5 shadow-[0_14px_34px_rgba(20, 20, 30,0.05)]">
          <p className="flex items-center gap-2 text-xs font-medium text-ink-mute">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            Topic trail
          </p>
          {history.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-[#f4f4f6] p-4 text-sm leading-6 text-[#52525b]">
              No saved checkpoint yet. Finish one short practice round to build history.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {history.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#ececf0] bg-[#fbfbfd] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-[#1a1a1f]">
                      {item.coordinate.label}
                    </p>
                    <p className="mt-0.5 text-xs text-[#52525b]">
                      {formatTransitionLabel(item.transition)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#86868b]">
                    L{item.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

      </section>
      </div>
      <SubtopicExplorer scope={scope} />
    </div>
  );
}

function PracticeWorkspace({
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
}: {
  payload: LearningSessionPayload | null;
  feedback: LearningAnswerPayload['feedback'] | null;
  loading: boolean;
  answering: boolean;
  error: string | null;
  onStart: () => void;
  onAnswer: (selectedOption: string) => void;
  onContinue: () => void;
  onStop: () => void;
  onOpenFlashcards: () => void;
}) {
  if (!payload && loading) {
    return (
      <section className="rounded-[1.5rem] border border-[#ececf0] bg-white p-6 shadow-[0_18px_44px_rgba(20, 20, 30,0.07)] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium text-ink-mute">
              <RefreshCw className="h-4 w-4 animate-spin text-[#3f6f57]" aria-hidden="true" />
              Preparing practice studio
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#1a1a1f]">
              Building your next learning set
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52525b]">
              The backend is selecting the right level, question set, and tutor context for this
              topic. This should stay short and smooth.
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-[#ececf0] bg-[#fbfbfd] p-4">
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

  if (!payload) {
    return (
      <section className="rounded-[1.5rem] border border-[#ececf0] bg-white p-6 shadow-[0_18px_44px_rgba(20, 20, 30,0.07)] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium text-ink-mute">
              <Target className="h-4 w-4" aria-hidden="true" />
              Practice
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#1a1a1f]">
              Start the adaptive round
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52525b]">
              A short database-backed learning set opens the live tutor flow. When it completes,
              the next set is prepared automatically so practice can continue until the student
              stops.
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
          <div className="rounded-[1.35rem] border border-[#ececf0] bg-[#fbfbfd] p-4">
            <div className="grid gap-2 text-sm font-semibold text-[#52525b]">
              <span className="rounded-xl bg-white px-3 py-3">1. Auto placement</span>
              <span className="rounded-xl bg-white px-3 py-3">2. Answer with tutor support</span>
              <span className="rounded-xl bg-white px-3 py-3">
                3. Continue sets until you stop
              </span>
              <span className="rounded-xl bg-white px-3 py-3">
                4. Level updates only with evidence
              </span>
            </div>
            <button
              type="button"
              onClick={onStart}
              disabled={loading}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3f6f57] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20, 20, 30,0.22)] transition hover:-translate-y-0.5 hover:bg-[#315844] disabled:cursor-not-allowed disabled:opacity-60"
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

  const complete = payload.session.status !== 'ACTIVE';
  const current = payload.currentItem;
  const progressPercent = Math.round(
    ((payload.session.currentSequence - 1) / payload.session.totalQuestions) * 100,
  );

  return (
    <div className="space-y-4 xl:flex xl:h-full xl:flex-col xl:overflow-hidden">
      <section className="rounded-[1.35rem] border border-[#ececf0] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(20,20,30,0.045)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium text-ink-mute">
              Adaptive signal
            </p>
            <p className="mt-1 text-sm font-bold text-[#1a1a1f]">
              {payload.placement.stageLabel} - {payload.session.coordinate.label}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#1a1a1f] px-3 py-2 text-white">
              {complete
                ? 'Round complete'
                : `Question ${payload.session.currentSequence}/${payload.session.totalQuestions}`}
            </span>
            <button type="button" onClick={onOpenFlashcards} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-primary-tint px-3 text-primary transition hover:bg-primary hover:text-white"><Sparkles className="h-3.5 w-3.5" /> Flashcards</button>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f2f2f5]">
          <div
            className="h-full rounded-full bg-[#3f6f57] transition-all duration-500"
            style={{ width: `${complete ? 100 : progressPercent}%` }}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)] xl:items-stretch">
        <section className="flex min-h-[32rem] flex-col rounded-[1.5rem] border border-[#ececf0] bg-white p-4 shadow-[0_16px_40px_rgba(20,20,30,0.05)] sm:p-5 xl:min-h-0">
          {complete ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl ${
                  payload.session.transition === 'MASTERED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : payload.session.transition === 'PREREQUISITE' ||
                        payload.session.transition === 'DEMOTED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-[#e7efe9] text-[#3f6f57]'
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
              <p className="mt-6 text-xs font-medium text-ink-mute">
                Adaptive checkpoint
              </p>
              <h3 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#1a1a1f]">
                {transitionTitle(payload)}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#52525b]">
                {transitionDetail(payload)}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                {feedback?.route ? (
                  <Link
                    href={learningUrl(feedback.route, { tab: 'practice' })}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3f6f57] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20, 20, 30,0.22)] transition hover:bg-[#315844] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Start {feedback.route.topic}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : payload.session.transition === 'MASTERED' ? null : (
                  <button
                    type="button"
                    onClick={onContinue}
                    disabled={loading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3f6f57] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20, 20, 30,0.22)] transition hover:bg-[#315844]"
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
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dedee3] px-5 py-2.5 text-sm font-bold text-[#52525b] transition hover:bg-[#f4f4f6]"
                >
                  Stop for now
                </button>
              </div>
            </div>
          ) : current ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-ink-mute">
                    Question card
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#52525b]">
                    Choose an answer. The tutor responds from this exact attempt.
                  </p>
                </div>
                {current.requiresRetry ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                    Retry with hint
                  </span>
                ) : null}
              </div>
              <div className="rounded-[1.35rem] border border-[#ececf0] bg-[#fbfbfd] p-2.5">
                <QuestionCard
                  questionText={current.questionText}
                  options={current.options}
                  disabled={answering}
                  compact
                  onSelect={(option) => onAnswer(option)}
                />
              </div>
              {answering ? (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#eef3f0] px-3 py-2.5 text-sm font-semibold text-[#2c4c3d]">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#3f6f57]" aria-hidden="true" />
                  Checking your reasoning...
                </p>
              ) : null}
              {feedback ? (
                <div
                  className={`mt-3 flex items-start gap-3 rounded-2xl border p-3.5 text-sm ${
                    feedback.kind === 'SOCRATIC_HINT'
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : feedback.kind === 'CORRECT'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-[#cfe0d4] bg-[#eef3f0] text-[#2c4c3d]'
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

export default function AdaptiveStudySession({
  scope,
  initialTab,
}: {
  scope: LearningScope;
  initialTab: LearningTab;
}) {
  const [activeTab, setActiveTab] = useState<LearningTab>(initialTab);
  const [flashcardsOpen, setFlashcardsOpen] = useState(initialTab === 'flashcards');
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
      setActiveTab(initialTab);
      setFlashcardsOpen(initialTab === 'flashcards');
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [initialTab]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPayload(null);
      setFeedback(null);
      setError(null);
      void refreshDashboard(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [refreshDashboard, scope.chapter, scope.subject, scope.topic]);

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
    <div className={`mx-auto max-w-7xl p-4 sm:p-8 lg:p-10 ${activeTab !== 'overview' ? 'xl:h-[100dvh] xl:overflow-hidden xl:p-6' : ''}`}>
      {activeTab === 'overview' ? <header className="rounded-[1.75rem] border border-hairline bg-surface p-4 shadow-[0_16px_40px_rgba(20,20,30,0.055)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex min-h-9 w-fit items-center justify-center gap-2 rounded-xl border border-hairline px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-primary/30 hover:bg-primary-tint/40 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Search
          </Link>

          <div className="min-w-0 text-left sm:text-right">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-mute">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Topic workspace
            </p>
            <h1 className="mt-1 truncate font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {scope.topic}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
              <span className="rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-soft">
                {scope.chapter}
              </span>
              <span className="rounded-full bg-primary-tint px-3 py-1.5 text-xs font-semibold text-primary">
                {topicState?.stageLabel ?? 'Placement pending'}
              </span>
            </div>
          </div>

        </div>
      </header> : null}

      {dashboardError && activeTab === 'overview' ? (
        <p
          className="mt-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {dashboardError}
        </p>
      ) : null}

      {/*
        All three panels stay mounted so each section loads in the background and
        switching tabs is instant — inactive panels are hidden, not unmounted.
      */}
      <div className={activeTab === 'overview' ? 'mt-6' : ''}>
        <div className={activeTab === 'overview' ? 'animate-fade' : 'hidden'}>
          {dashboardLoading ? (
            <DashboardSkeleton />
          ) : (
            <TopicOverview
              scope={scope}
              topicState={topicState}
              dashboard={dashboard}
              onOpenPractice={() => setActiveTab('practice')}
            />
          )}
        </div>
        <div className={activeTab !== 'overview' ? 'space-y-5 animate-fade' : 'hidden'}>
          <PracticeWorkspace
            payload={payload}
            feedback={feedback}
            loading={loading}
            answering={answering}
            error={error}
            onStart={() => void start()}
            onAnswer={(selectedOption) => void answer(selectedOption)}
            onContinue={() => void start()}
            onStop={stopPractice}
            onOpenFlashcards={() => setFlashcardsOpen(true)}
          />
          {flashcardsOpen ? <FlashcardDeck scope={scope} onClose={() => setFlashcardsOpen(false)} /> : null}
        </div>
      </div>
    </div>
  );
}
