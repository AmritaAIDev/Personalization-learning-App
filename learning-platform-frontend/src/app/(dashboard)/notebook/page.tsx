"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Brain,
  ChevronDown,
  CircleDot,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { learningScopeFromSearchParams, learningUrl } from "@/lib/learning";
import type {
  NotebookConceptGroup,
  NotebookConceptsResponse,
  NotebookMistakeCard,
} from "@/lib/notebook-types";
import type { FlashcardRating } from "@/lib/learning-types";
import AttemptResultQuestionRow from "@/components/results/AttemptResultQuestionRow";
import TargetedPracticeCard from "@/components/learning/TargetedPracticeCard";

type ReviewResult = { dueReviewAt: string; reviewState: "UPCOMING" };
type OnReviewed = (cardId: string, next: ReviewResult) => void;

// Mirrors FlashcardDeck.tsx's RATINGS — same labels/captions/tone colors,
// so recall-rating reads as one consistent pattern across the app.
const MISTAKE_RATINGS: Array<{
  value: FlashcardRating;
  label: string;
  caption: string;
  className: string;
}> = [
  {
    value: "AGAIN",
    label: "Again",
    caption: "Show soon",
    className: "border-danger/25 bg-danger-tint text-danger hover:opacity-80",
  },
  {
    value: "HARD",
    label: "Hard",
    caption: "Shaky",
    className:
      "border-warning/25 bg-warning-tint text-warning hover:opacity-80",
  },
  {
    value: "GOOD",
    label: "Good",
    caption: "Recalled",
    className:
      "border-success/25 bg-success-tint text-success hover:opacity-80",
  },
  {
    value: "EASY",
    label: "Easy",
    caption: "Instant",
    className: "border-info/25 bg-info-tint text-info hover:opacity-80",
  },
];

const StudyMarkdown = dynamic(
  () => import("@/components/learning/StudyMarkdown"),
  { ssr: false },
);

function practiceHref(group: NotebookConceptGroup) {
  const params = new URLSearchParams({
    subject: group.practiceSimilar.subject,
    chapter: group.practiceSimilar.chapter,
    topic: group.practiceSimilar.topic,
  });
  return `/practice?${params.toString()}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

const SOURCE_LABEL: Record<NotebookConceptGroup["summarySource"], string> = {
  LLM: "AI insight",
  CACHE: "AI insight",
  FALLBACK: "From your answers",
};

function NotebookSkeleton() {
  return (
    <div className="mt-5 grid gap-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-hairline bg-surface p-4"
        >
          <div className="h-4 w-2/5 animate-pulse rounded-full bg-ink-solid/10" />
          <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-ink-solid/8" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-ink-solid/8" />
        </div>
      ))}
    </div>
  );
}

function EmptyNotebook() {
  return (
    <div className="mt-5 rounded-2xl border border-hairline bg-surface p-6 text-center sm:p-10">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-tint text-primary">
        <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-heading text-xl font-semibold text-ink">
        No mistake cards yet
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-soft">
        Once you submit practice or answer adaptive learning questions, your
        wrong answers are clubbed here by concept with a clear gap to repair.
      </p>
      <div className="mt-5 flex justify-center">
        <Link
          href="/practice"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-ink-solid px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-solid/90"
        >
          Start practice
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function MistakeDetail({
  card,
  onReviewed,
}: {
  card: NotebookMistakeCard;
  onReviewed: OnReviewed;
}) {
  const [submitting, setSubmitting] = useState<FlashcardRating | null>(null);

  const rate = async (rating: FlashcardRating) => {
    setSubmitting(rating);
    try {
      const result = await apiFetch<{ data: ReviewResult }>(
        `/api/notebook/mistakes/${card.source}/${card.questionId}/review`,
        { method: "POST", body: JSON.stringify({ rating }) },
      );
      onReviewed(card.id, result.data);
    } catch {
      // A failed rating just leaves the card due — safe to retry.
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <article className="rounded-xl border border-hairline bg-canvas p-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
        <span className="rounded-full bg-primary-tint px-2.5 py-0.5 text-primary">
          {card.source === "ADAPTIVE" ? "Learn" : card.source === "DIAGNOSTIC" ? "Diagnostic" : "Practice"}
        </span>
        <span className="text-ink-mute">
          {card.bloomLevel} {"\u00B7"} {card.difficulty}
        </span>
        <span className="ml-auto font-medium text-ink-mute">
          {formatDate(card.occurredAt)}
        </span>
      </div>

      <StudyMarkdown className="mt-3 text-sm font-semibold leading-6 text-ink">
        {card.questionText}
      </StudyMarkdown>

      <AttemptResultQuestionRow
        isCorrect={false}
        yourAnswer={
          <StudyMarkdown>{card.selectedOption ?? "Not answered"}</StudyMarkdown>
        }
        correctAnswer={<StudyMarkdown>{card.correctOption}</StudyMarkdown>}
      />

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-hairline bg-canvas px-3 py-2">
        <Brain
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-[13px] leading-5 text-ink-soft">
          {card.misconception}
        </p>
      </div>

      <details className="mt-2 rounded-xl border border-hairline bg-canvas px-3 py-2">
        <summary className="cursor-pointer text-[13px] font-semibold text-ink">
          View worked solution
        </summary>
        <StudyMarkdown className="mt-2 text-[13px] leading-5 text-ink-soft">
          {card.solution}
        </StudyMarkdown>
      </details>

      {card.reviewState === "DUE" ? (
        <div className="mt-3 border-t border-hairline pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
            How well did you recall this?
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {MISTAKE_RATINGS.map((rating) => (
              <button
                key={rating.value}
                type="button"
                disabled={submitting !== null}
                onClick={() => void rate(rating.value)}
                className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${rating.className}`}
              >
                <span className="block">{rating.label}</span>
                <span className="mt-0.5 block text-[10px] font-semibold opacity-70">
                  {submitting === rating.value ? "Saving…" : rating.caption}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

/**
 * Practice for the group's most-repeated classified misconception (AI Phase
 * 2.2), via the shared on-demand generation card.
 */
function MisconceptionPractice({ group }: { group: NotebookConceptGroup }) {
  const dominant = group.dominantMisconception;
  if (!dominant) return null;

  return (
    <TargetedPracticeCard
      reason="MISCONCEPTION"
      focusText={dominant.text}
      scope={{
        subject: group.subject,
        chapter: group.chapter,
        topic: group.topic,
      }}
      triggerLabel="Practice this misconception"
      contextLine={
        <div className="flex items-start gap-2">
          <Target
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p className="text-[13px] leading-5 text-ink-soft">
            Repeated {dominant.count}&times;: {dominant.text}
          </p>
        </div>
      }
    />
  );
}

function ConceptGroupRow({
  group,
  onReviewed,
}: {
  group: NotebookConceptGroup;
  onReviewed: (groupId: string, cardId: string, next: ReviewResult) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dueLabel =
    group.dueCount > 0 ? `${group.dueCount} due for review` : "Up to date";

  return (
    <article className="rounded-2xl border border-hairline bg-surface p-4 transition hover:border-primary/20 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-mute">
            <span className="rounded-full bg-primary-tint px-2.5 py-0.5 text-primary">
              {group.subject}
            </span>
            <span className="text-ink-mute">{group.chapter}</span>
          </div>
          <h3 className="mt-2 font-heading text-base font-bold leading-6 text-ink sm:text-lg">
            {group.conceptLabel}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] font-bold text-ink-mute">
          <span className="rounded-full bg-canvas px-2.5 py-0.5 text-ink-soft">
            {group.mistakeCount} mistake{group.mistakeCount === 1 ? "" : "s"}
          </span>
          <span
            className={`px-1 ${
              group.dueCount > 0 ? "text-warning" : "text-ink-mute"
            }`}
          >
            {dueLabel}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <Sparkles
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-[13px] leading-5 text-ink-soft">
          {group.misconceptionSummary}
        </p>
      </div>

      <MisconceptionPractice group={group} />

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
        {group.bloomLevels.map((level) => (
          <span
            key={level}
            className="rounded-full bg-canvas px-2 py-0.5 text-ink-soft"
          >
            {level}
          </span>
        ))}
        {group.difficulties.map((level) => (
          <span
            key={level}
            className="rounded-full bg-canvas px-2 py-0.5 text-ink-mute"
          >
            {level}
          </span>
        ))}
        <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.12em] text-ink-mute">
          {SOURCE_LABEL[group.summarySource]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
        <Link
          href={practiceHref(group)}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-ink-solid px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-ink-solid/90"
        >
          Practice this concept
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-hairline px-3 py-2 text-[13px] font-semibold text-ink-soft transition hover:bg-canvas"
        >
          {expanded
            ? "Hide questions"
            : `Review ${group.mistakeCount} question${group.mistakeCount === 1 ? "" : "s"}`}
          <ChevronDown
            className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {expanded ? (
        <div className="mt-3 grid gap-3">
          {group.cards.map((card) => (
            <MistakeDetail
              key={card.id}
              card={card}
              onReviewed={(cardId, next) =>
                onReviewed(group.id, cardId, next)
              }
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function NotebookPage() {
  const searchParams = useSearchParams();
  const routeScope = learningScopeFromSearchParams(searchParams);
  const [concepts, setConcepts] = useState<NotebookConceptsResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"mistakes" | "due">("mistakes");

  const loadConcepts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<NotebookConceptsResponse>(
        "/api/notebook/concepts",
      );
      setConcepts(data);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to load the notebook right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialConcepts = async () => {
      await loadConcepts();
    };
    void loadInitialConcepts();
  }, [loadConcepts]);

  const visibleGroups = useMemo(() => {
    if (!concepts) return null;
    if (!routeScope) return concepts.groups;
    return concepts.groups.filter(
      (group) =>
        group.subject === routeScope.subject &&
        group.chapter === routeScope.chapter &&
        group.topic === routeScope.topic,
    );
  }, [concepts, routeScope]);

  const stats = useMemo(() => {
    if (!concepts || !visibleGroups) return null;
    const mistakes = visibleGroups.reduce(
      (sum, group) => sum + group.mistakeCount,
      0,
    );
    const due = visibleGroups.reduce((sum, group) => sum + group.dueCount, 0);
    return [
      { label: "Repair concepts", value: visibleGroups.length },
      { label: "Mistake cards", value: mistakes },
      { label: "Due now", value: due },
    ];
  }, [concepts, visibleGroups]);

  const sortedGroups = useMemo(() => {
    if (!visibleGroups) return [];
    const groups = [...visibleGroups];
    groups.sort((left, right) => {
      if (sortBy === "due") {
        if (right.dueCount !== left.dueCount)
          return right.dueCount - left.dueCount;
        return (
          new Date(right.lastOccurredAt).getTime() -
          new Date(left.lastOccurredAt).getTime()
        );
      }
      return right.mistakeCount - left.mistakeCount;
    });
    return groups;
  }, [visibleGroups, sortBy]);

  const priority = sortedGroups[0] ?? null;

  const handleReviewed = useCallback(
    (groupId: string, cardId: string, next: ReviewResult) => {
      setConcepts((current) => {
        if (!current) return current;
        const groups = current.groups.map((group) => {
          if (group.id !== groupId) return group;
          const cards = group.cards.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  dueReviewAt: next.dueReviewAt,
                  reviewState: next.reviewState,
                }
              : card,
          );
          const dueCount = cards.filter(
            (card) => card.reviewState === "DUE",
          ).length;
          return { ...group, cards, dueCount };
        });
        return { ...current, groups };
      });
    },
    [],
  );

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8 sm:pt-8 lg:px-10">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Notebook
            </p>
            <h1 className="mt-1 font-heading page-title text-ink">
              Repair what actually broke.
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {routeScope ? (
              <Link
                href={learningUrl(routeScope, { tab: "practice" })}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong"
              >
                Continue repair
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
            <Link
              href="/practice"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-ink-solid px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-solid/90"
            >
              Practice weak topics
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {stats && !loading && !error ? (
          <dl className="mt-5 grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-hairline bg-surface px-3 py-3 shadow-[0_10px_24px_rgba(20,20,30,0.035)]"
              >
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                  {stat.label}
                </dt>
                <dd className="mt-0.5 font-heading text-lg font-bold text-ink">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {loading ? <NotebookSkeleton /> : null}

        {!loading && error ? (
          <div className="mt-5 rounded-2xl border border-danger/25 bg-danger-tint p-5 text-danger">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-semibold">Notebook could not load</h2>
                <p className="mt-1 text-sm leading-6">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadConcepts()}
                  className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-danger px-3 py-1.5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && !error && concepts && concepts.groups.length === 0 ? (
          <EmptyNotebook />
        ) : null}

        {!loading && !error && concepts && concepts.groups.length > 0 ? (
          <>
            {sortedGroups.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-hairline bg-surface p-8 text-center">
                <BookOpenCheck
                  className="mx-auto h-8 w-8 text-primary"
                  aria-hidden="true"
                />
                <h2 className="mt-3 font-heading text-xl font-semibold text-ink">
                  No repair cards for this topic
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-mute">
                  Practice or Learn mistakes for this workspace will appear
                  here automatically.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
                <aside className="space-y-3">
                  {priority ? (
                    <section className="rounded-[1.5rem] bg-ink-solid p-5 text-white shadow-[0_16px_34px_rgba(20,20,30,0.14)]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                        Repair priority
                      </p>
                      <h2 className="mt-2 font-heading text-xl font-semibold leading-7">
                        {priority.conceptLabel}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/65">
                        {priority.misconceptionSummary}
                      </p>
                      <Link
                        href={practiceHref(priority)}
                        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-primary-tint"
                      >
                        Repair now
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </section>
                  ) : null}

                  <section className="rounded-[1.5rem] border border-hairline bg-surface p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-mute">
                      Notebook view
                    </p>
                    <div className="mt-3 grid gap-2 text-[12px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSortBy("mistakes")}
                        className={`rounded-xl px-3 py-2 text-left transition ${
                          sortBy === "mistakes"
                            ? "bg-primary text-white"
                            : "bg-canvas text-ink-soft hover:bg-primary-tint/50"
                        }`}
                      >
                        Most repeated gaps
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy("due")}
                        className={`rounded-xl px-3 py-2 text-left transition ${
                          sortBy === "due"
                            ? "bg-primary text-white"
                            : "bg-canvas text-ink-soft hover:bg-primary-tint/50"
                        }`}
                      >
                        Due for review
                      </button>
                    </div>
                  </section>
                </aside>

                <section className="grid gap-3">
                  {sortedGroups.map((group) => (
                    <ConceptGroupRow
                      key={group.id}
                      group={group}
                      onReviewed={handleReviewed}
                    />
                  ))}
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-mute">
                    <CircleDot className="h-3 w-3" aria-hidden="true" />
                    Summaries refresh when you make a new mistake in a topic.
                  </p>
                </section>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
