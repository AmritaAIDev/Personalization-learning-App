"use client";

import { ArrowRight, Layers3, SearchCheck, Sparkles } from "lucide-react";
import type {
  LearningDashboardPayload,
  LearningScope,
  LearningState,
} from "@/lib/learning-types";
import SubtopicExplorer from "./SubtopicExplorer";

function formatTransitionLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

/**
 * Read-only picture of where the learner stands on this topic: mastery,
 * accuracy, current checkpoint, recent trail, and the concept breakdown.
 */
export default function TopicOverview({
  scope,
  topicState,
  dashboard,
  onOpenPractice,
  onOpenFlashcards,
}: {
  scope: LearningScope;
  topicState: LearningState | null;
  dashboard: LearningDashboardPayload | null;
  onOpenPractice: () => void;
  onOpenFlashcards: () => void;
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
    topicState?.status === "MASTERED"
      ? "Mastered"
      : topicState?.status === "PAUSED_FOR_PREREQUISITE"
        ? "Foundation needed"
        : topicState
          ? "In progress"
          : "Ready to place";
  const coordinate = topicState?.currentCoordinate;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <section className="overflow-hidden rounded-[1.75rem] border border-hairline bg-surface shadow-[0_16px_38px_rgba(20,20,30,0.06)]">
          <div className="border-b border-hairline bg-[linear-gradient(135deg,#f5faf7_0%,#ffffff_62%)] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
                  <SearchCheck className="h-4 w-4" aria-hidden="true" />
                  Current learning route
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-ink">
                  {topicState
                    ? topicState.stageLabel
                    : "Start placement through practice"}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
                  {topicState?.nextFocus ??
                    "One short round places you automatically from your own answers."}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={onOpenPractice}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.18)] transition hover:-translate-y-0.5 hover:bg-primary-strong"
                >
                  {topicState ? "Continue practice" : "Start practice"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onOpenFlashcards}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-tint px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Flashcards
                </button>
              </div>
            </div>

            <div
              className="mt-6 h-2 overflow-hidden rounded-full bg-canvas"
              role="progressbar"
              aria-valuenow={topicState?.masteryPercent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Topic mastery"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${topicState?.masteryPercent ?? 0}%` }}
              />
            </div>
          </div>

          <dl className="grid divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4 sm:px-6">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
                Mastery
              </dt>
              <dd className="mt-1 font-heading text-xl font-bold text-ink">
                {topicState?.masteryPercent ?? 0}%
              </dd>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
                Accuracy
              </dt>
              <dd className="mt-1 font-heading text-xl font-bold text-ink">
                {accuracy === null ? "—" : `${accuracy}%`}
              </dd>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
                Checkpoint
              </dt>
              <dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-ink">
                <span>
                  {coordinate
                    ? `Level ${topicState?.currentLevel}`
                    : "Not placed"}
                </span>
                <span className="text-ink-mute">
                  {coordinate
                    ? `${coordinate.bloomLevel} · ${coordinate.difficulty}`
                    : status}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        <article className="rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
          <p className="flex items-center gap-2 text-xs font-medium text-ink-mute">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            Topic trail
          </p>
          {history.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-canvas p-4 text-sm leading-6 text-ink-soft">
              No saved checkpoint yet. Finish one short practice round to build
              history.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {history.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-white/70 px-4 py-3 shadow-[0_8px_18px_rgba(20,20,30,0.025)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">
                      {item.coordinate.label}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {formatTransitionLabel(item.transition)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-ink-mute">
                    L{item.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <SubtopicExplorer scope={scope} />
    </div>
  );
}
