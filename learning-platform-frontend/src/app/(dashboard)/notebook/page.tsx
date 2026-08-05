"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Brain,
  ChevronDown,
  CircleDot,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import StudyMarkdown from "@/components/learning/StudyMarkdown";
import type {
  NotebookConceptGroup,
  NotebookConceptsResponse,
  NotebookMistakeCard,
} from "@/lib/notebook-types";

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
          <div className="h-4 w-2/5 animate-pulse rounded-full bg-ink/10" />
          <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-ink/8" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-ink/8" />
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
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          Start practice
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function MistakeDetail({ card }: { card: NotebookMistakeCard }) {
  return (
    <article className="rounded-xl border border-hairline bg-canvas p-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
        <span className="rounded-full bg-primary-tint px-2.5 py-0.5 text-primary">
          {card.source === "ADAPTIVE" ? "Learn" : "Practice"}
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

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-rose-200/60 bg-rose-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-500">
            Your answer
          </p>
          <StudyMarkdown className="mt-0.5 text-[13px] font-semibold text-rose-800">
            {card.selectedOption ?? "Not answered"}
          </StudyMarkdown>
        </div>
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
            Correct answer
          </p>
          <StudyMarkdown className="mt-0.5 text-[13px] font-semibold text-emerald-800">
            {card.correctOption}
          </StudyMarkdown>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-hairline bg-white px-3 py-2">
        <Brain
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-[13px] leading-5 text-ink-soft">
          {card.misconception}
        </p>
      </div>

      <details className="mt-2 rounded-xl border border-hairline bg-white px-3 py-2">
        <summary className="cursor-pointer text-[13px] font-semibold text-ink">
          View worked solution
        </summary>
        <StudyMarkdown className="mt-2 text-[13px] leading-5 text-ink-soft">
          {card.solution}
        </StudyMarkdown>
      </details>
    </article>
  );
}

function ConceptGroupRow({ group }: { group: NotebookConceptGroup }) {
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
              group.dueCount > 0 ? "text-amber-700" : "text-ink-mute"
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
          className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-ink/90"
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
            <MistakeDetail key={card.id} card={card} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function NotebookPage() {
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

  const stats = useMemo(() => {
    if (!concepts) return null;
    return [
      { label: "Concepts to repair", value: concepts.groupCount },
      { label: "Practice mistakes", value: concepts.summary.practiceMistakes },
      { label: "Learn mistakes", value: concepts.summary.adaptiveMistakes },
    ];
  }, [concepts]);

  const sortedGroups = useMemo(() => {
    if (!concepts) return [];
    const groups = [...concepts.groups];
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
  }, [concepts, sortBy]);

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-8 sm:pt-8 lg:px-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Mistake notebook
            </h1>
            <p className="mt-1 text-[13px] leading-5 text-ink-soft">
              Wrong answers clubbed by concept, with the recurring gap to
              repair.
            </p>
          </div>
          <Link
            href="/practice"
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Practice weak topics
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        {stats && !loading && !error ? (
          <dl className="mt-4 grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-hairline bg-surface px-3 py-2.5"
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
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
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
                  className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-rose-700"
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
            <div className="mt-4 flex items-center justify-end gap-2 text-[11px] font-bold">
              <span className="text-ink-mute">Sort:</span>
              <button
                type="button"
                onClick={() => setSortBy("mistakes")}
                className={`rounded-full px-2.5 py-0.5 transition ${
                  sortBy === "mistakes"
                    ? "bg-primary text-white"
                    : "bg-canvas text-ink-soft hover:bg-primary-tint/50"
                }`}
              >
                Most mistakes
              </button>
              <button
                type="button"
                onClick={() => setSortBy("due")}
                className={`rounded-full px-2.5 py-0.5 transition ${
                  sortBy === "due"
                    ? "bg-primary text-white"
                    : "bg-canvas text-ink-soft hover:bg-primary-tint/50"
                }`}
              >
                Due for review
              </button>
            </div>
            <div className="mt-3 grid gap-3">
              {sortedGroups.map((group) => (
                <ConceptGroupRow key={group.id} group={group} />
              ))}
              <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-mute">
                <CircleDot className="h-3 w-3" aria-hidden="true" />
                Summaries refresh when you make a new mistake in a topic.
              </p>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
