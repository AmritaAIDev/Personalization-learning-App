"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, CircleAlert, Map } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isMissTransition, learningUrl } from "@/lib/learning";
import type {
  LearningAnswerPayload,
  LearningDashboardPayload,
  LearningScope,
  LearningSessionPayload,
  LearningState,
  LearningTab,
} from "@/lib/learning-types";
import FlashcardDeck from "./FlashcardDeck";
import LearningTabs from "./LearningTabs";
import PracticeWorkspace from "./PracticeWorkspace";
import TopicOverview from "./TopicOverview";

function getTopicState(
  dashboard: LearningDashboardPayload | null,
  scope: LearningScope,
): LearningState | null {
  if (!dashboard) return null;
  const matches = (topic: LearningState) =>
    topic.subject === scope.subject &&
    topic.chapter === scope.chapter &&
    topic.topic === scope.topic;
  return (
    dashboard.activeTopics.find(matches) ??
    dashboard.completedTopics.find(matches) ??
    null
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]"
      aria-label="Loading topic dashboard"
    >
      <div className="rounded-[1.5rem] border border-hairline bg-surface p-5">
        <div className="h-3 w-28 rounded-full skeleton" />
        <div className="mt-5 h-8 w-64 rounded-full skeleton" />
        <div className="mt-4 h-3 w-full rounded-full skeleton" />
        <div className="mt-2 h-3 w-3/4 rounded-full skeleton" />
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-40 rounded-[1.5rem] skeleton" />
        <div className="h-40 rounded-[1.5rem] skeleton" />
      </div>
    </div>
  );
}

/**
 * Topic workspace shell. It owns session and dashboard state and keeps all
 * three surfaces mounted, so switching tabs is instant and an in-flight
 * practice round is never thrown away by navigation.
 */
export default function AdaptiveStudySession({
  scope,
  initialTab,
}: {
  scope: LearningScope;
  initialTab: LearningTab;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LearningTab>(initialTab);
  const [payload, setPayload] = useState<LearningSessionPayload | null>(null);
  const [feedback, setFeedback] = useState<
    LearningAnswerPayload["feedback"] | null
  >(null);
  /**
   * The question that was just answered wrong, kept around only for the
   * round-outcome screen's "try a similar one" — `currentItem` itself is
   * gone by then (the round has moved past it).
   */
  const [missedItem, setMissedItem] = useState<
    LearningSessionPayload["currentItem"]
  >(null);
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<LearningDashboardPayload | null>(
    null,
  );
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  /** Tab to return to when the flashcard deck closes. */
  const returnTabRef = useRef<LearningTab>(
    initialTab === "flashcards" ? "practice" : initialTab,
  );

  /**
   * The skeleton is driven by the initial `dashboardLoading` state rather than
   * by a flag set before the request, so a refresh after an answer updates the
   * panel in place instead of flashing it away.
   */
  const refreshDashboard = useCallback(
    () =>
      apiFetch<LearningDashboardPayload>("/api/learning/dashboard")
        .then((next) => {
          setDashboard(next);
          setDashboardError(null);
        })
        .catch((reason: unknown) => {
          setDashboardError(
            reason instanceof Error
              ? reason.message
              : "The topic dashboard could not be loaded.",
          );
        })
        .finally(() => setDashboardLoading(false)),
    [],
  );

  // Adjusting state while rendering is the supported way to follow a prop; an
  // effect here would cost an extra render on every tab change.
  const [trackedTab, setTrackedTab] = useState(initialTab);
  if (trackedTab !== initialTab) {
    setTrackedTab(initialTab);
    setActiveTab(initialTab);
  }

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  /** Tab changes are reflected in the URL so a workspace view stays shareable. */
  const selectTab = useCallback(
    (tab: LearningTab) => {
      if (tab !== "flashcards") returnTabRef.current = tab;
      setActiveTab(tab);
      router.replace(learningUrl(scope, { tab }), { scroll: false });
    },
    [router, scope],
  );

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await apiFetch<LearningSessionPayload>(
        "/api/learning/sessions",
        {
          method: "POST",
          body: JSON.stringify(scope),
        },
      );
      setPayload(next);
      setFeedback(null);
      setMissedItem(null);
      void refreshDashboard();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The learning journey could not be opened.",
      );
    } finally {
      setLoading(false);
    }
  }, [refreshDashboard, scope]);

  const answer = useCallback(
    async (selectedOption: string) => {
      if (!payload?.currentItem || answering) return;
      const answeredItem = payload.currentItem;
      setAnswering(true);
      setError(null);
      try {
        const next = await apiFetch<LearningAnswerPayload>(
          `/api/learning/sessions/${payload.session.id}/items/${payload.currentItem.id}/answer`,
          { method: "POST", body: JSON.stringify({ selectedOption }) },
        );
        setPayload(next);
        setFeedback(next.feedback);
        setMissedItem(
          isMissTransition(next.session.transition) ? answeredItem : null,
        );
        if (next.session.status !== "ACTIVE") void refreshDashboard();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Your answer could not be checked.",
        );
      } finally {
        setAnswering(false);
      }
    },
    [answering, payload, refreshDashboard],
  );

  // A correct answer confirmation is a moment, not a permanent banner.
  useEffect(() => {
    if (feedback?.kind !== "CORRECT") return;
    const timeout = window.setTimeout(() => setFeedback(null), 2_600);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const stopPractice = () => {
    setPayload(null);
    setFeedback(null);
    setMissedItem(null);
    setError(null);
    selectTab("overview");
  };

  const topicState = getTopicState(dashboard, scope);
  const isStudySurface = activeTab !== "overview";

  return (
    <div
      className={`mx-auto max-w-7xl p-4 sm:p-8 lg:p-10 ${
        isStudySurface ? "xl:h-[100dvh] xl:overflow-hidden xl:p-6" : ""
      }`}
    >
      <header className="rounded-2xl border border-hairline bg-surface px-3 py-2.5 shadow-[0_8px_22px_rgba(20,20,30,0.04)] sm:px-4">
        {/* Breadcrumb keeps the learner oriented and Journey one tap away, so the
            topic workspace never feels like a dead end. */}
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-mute"
        >
          <Link
            href="/journey"
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1 py-0.5 font-semibold text-ink-soft transition hover:bg-primary-tint/50 hover:text-primary"
          >
            <Map className="h-3.5 w-3.5" aria-hidden="true" />
            Journey
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="shrink-0 truncate">{scope.subject}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">{scope.chapter}</span>
        </nav>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-hairline px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-primary/30 hover:bg-primary-tint/40 hover:text-primary"
            title="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="truncate font-heading text-sm font-bold text-ink">
              {scope.topic}
            </span>
          </Link>
          <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-semibold text-primary">
            {topicState?.stageLabel ?? "Placement pending"}
          </span>
          <div className="ml-auto">
            <LearningTabs activeTab={activeTab} onChange={selectTab} />
          </div>
        </div>
      </header>

      {dashboardError && activeTab === "overview" ? (
        <p
          className="mt-5 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-4 py-3 text-sm font-medium text-danger"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {dashboardError}
        </p>
      ) : null}

      {/*
        Both panels stay mounted so an active round survives a tab switch and
        returning to it is instant — the inactive panel is hidden, not unmounted.
      */}
      <div className="mt-5">
        <div className={activeTab === "overview" ? "animate-fade" : "hidden"}>
          {dashboardLoading ? (
            <DashboardSkeleton />
          ) : (
            <TopicOverview
              scope={scope}
              topicState={topicState}
              dashboard={dashboard}
              onOpenPractice={() => selectTab("practice")}
              onOpenFlashcards={() => selectTab("flashcards")}
            />
          )}
        </div>
        <div className={isStudySurface ? "animate-fade" : "hidden"}>
          <PracticeWorkspace
            payload={payload}
            feedback={feedback}
            missedItem={missedItem}
            scope={scope}
            loading={loading}
            answering={answering}
            error={error}
            onStart={() => void start()}
            onAnswer={(selectedOption) => void answer(selectedOption)}
            onContinue={() => void start()}
            onStop={stopPractice}
            onOpenFlashcards={() => selectTab("flashcards")}
          />
        </div>
      </div>

      {activeTab === "flashcards" ? (
        <FlashcardDeck
          scope={scope}
          onClose={() => selectTab(returnTabRef.current)}
        />
      ) : null}
    </div>
  );
}
