"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleX,
  GraduationCap,
  Lightbulb,
  RotateCcw,
  Target,
} from "lucide-react";
import ExplainThis from "@/components/learning/ExplainThis";
import TargetedPracticeCard from "@/components/learning/TargetedPracticeCard";
import ConfidenceBadge from "@/components/diagnostic/ConfidenceBadge";
import { apiFetch } from "@/lib/api";
import { learningUrl } from "@/lib/learning";
import { practiceHref } from "@/lib/practice";
import type {
  PracticePerformanceRow,
  PracticeReviewPayload,
} from "@/lib/practice-types";
import AttemptResultHero from "@/components/results/AttemptResultHero";
import AttemptResultQuestionRow from "@/components/results/AttemptResultQuestionRow";

const StudyMarkdown = dynamic(
  () => import("@/components/learning/StudyMarkdown"),
  { ssr: false },
);

type ResultFilter = "all" | "incorrect" | "correct";

const FILTERS: Array<{ value: ResultFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "incorrect", label: "To revisit" },
  { value: "correct", label: "Correct" },
];

function PerformanceRow({ row }: { row: PracticePerformanceRow }) {
  const color =
    row.status === "strong"
      ? "#15803d"
      : row.status === "average"
        ? "#b45309"
        : "#be123c";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-ink-soft">{row.label}</span>
        <span className="font-bold" style={{ color }}>
          {row.correct}/{row.total} · {row.score}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${row.score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/**
 * Post-submission review. Everything shown here — score, per-skill breakdown,
 * solutions, weak concepts — is calculated by the backend; the client only
 * arranges it and helps the learner move to the next useful action.
 */
export default function PracticeReview({ attemptId }: { attemptId: string }) {
  const [payload, setPayload] = useState<PracticeReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ResultFilter>("all");
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [hasToggledQuestion, setHasToggledQuestion] = useState(false);

  const loadReview = useCallback(async () => {
    try {
      const data = await apiFetch<PracticeReviewPayload>(
        `/api/practice/sessions/${attemptId}/review`,
      );
      setPayload(data);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The practice review could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  // The request is started directly so no state is written before it begins;
  // `loading` starts true and is cleared when the review lands.
  useEffect(() => {
    let active = true;
    void apiFetch<PracticeReviewPayload>(
      `/api/practice/sessions/${attemptId}/review`,
    )
      .then((data) => {
        if (!active) return;
        setPayload(data);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "The practice review could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attemptId]);

  const results = useMemo(() => {
    if (!payload) return [];
    if (filter === "incorrect") {
      return payload.results.filter((result) => !result.isCorrect);
    }
    if (filter === "correct") {
      return payload.results.filter((result) => result.isCorrect);
    }
    return payload.results;
  }, [filter, payload]);

  // Review opens on the first question that needs attention, derived rather
  // than assigned, so the learner's own expand/collapse always wins afterwards.
  const activeQuestionId = hasToggledQuestion
    ? openQuestionId
    : (payload?.results.find((result) => !result.isCorrect)?.questionId ??
      null);

  if (loading) {
    return (
      <div
        className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10"
        aria-label="Calculating your review"
      >
        <div className="h-24 rounded-2xl skeleton" />
        <div className="mt-6 space-y-3">
          <div className="h-20 rounded-2xl skeleton" />
          <div className="h-20 rounded-2xl skeleton" />
          <div className="h-20 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
        <CircleAlert className="h-9 w-9 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink">
          We could not show this review
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          {error ?? "This practice session may not be ready for review."}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadReview();
          }}
          className="mt-6 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-strong"
        >
          Try again
        </button>
      </div>
    );
  }

  const { analysis, attempt } = payload;
  const scope = {
    subject: attempt.subject,
    chapter: attempt.chapter,
    topic: attempt.topic,
  };

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <header className="flex flex-col gap-5 border-b border-hairline pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium text-ink-mute">
            <Target className="h-4 w-4" aria-hidden="true" /> Practice review
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {attempt.topic}
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            {analysis.correct} of {analysis.total} correct. Work through the
            explanations while the reasoning is still fresh.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={practiceHref(scope)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink-solid px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-solid/90"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Practice again
          </Link>
          <Link
            href={learningUrl(scope, { tab: "practice" })}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-tint px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
          >
            <GraduationCap className="h-4 w-4" aria-hidden="true" /> Learn with
            tutor
          </Link>
        </div>
      </header>

      <section className="mt-7 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <AttemptResultHero
          eyebrow={analysis.grade}
          score={
            <p className="font-heading text-6xl font-bold tracking-tight">
              {analysis.scorePercent}%
            </p>
          }
          statsLine={`${analysis.correct} correct · ${analysis.incorrect} to revisit · ${analysis.total} total`}
          progressPercent={analysis.scorePercent}
        />

        <article className="rounded-[2rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-7">
          <h2 className="font-heading text-xl font-bold text-ink">
            Performance by difficulty
          </h2>
          <div className="mt-6 space-y-5">
            {analysis.difficultyPerformance.map((row) => (
              <PerformanceRow key={row.label} row={row} />
            ))}
          </div>
          <h2 className="mt-8 border-t border-hairline pt-6 font-heading text-xl font-bold text-ink">
            Thinking skills
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {analysis.bloomPerformance.map((row) => (
              <PerformanceRow key={row.label} row={row} />
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-hairline bg-surface p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium text-ink-mute">
              <Lightbulb className="h-4 w-4" aria-hidden="true" /> Focus next
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold text-ink">
              Concepts that need another pass
            </h2>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-strong"
          >
            Choose another unit{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {analysis.weakConcepts.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {analysis.weakConcepts.map((concept) => (
              <span
                key={concept}
                className="rounded-full bg-primary-tint px-3 py-2 text-sm font-bold text-primary-strong"
              >
                {concept}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-ink-soft">
            No concept fell below 50% in this session. Keep building speed and
            consistency with another reviewed set.
          </p>
        )}
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-ink-mute">
              Question-by-question review
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-ink">
              Learn from the reasoning
            </h2>
          </div>
          <div
            className="flex gap-1 rounded-xl border border-hairline bg-surface p-1"
            role="tablist"
            aria-label="Filter results"
          >
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={filter === item.value}
                onClick={() => setFilter(item.value)}
                className={`min-h-9 rounded-lg px-3 text-xs font-bold transition ${
                  filter === item.value
                    ? "bg-primary text-white"
                    : "text-ink-soft hover:bg-canvas"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {results.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-canvas p-5 text-sm leading-6 text-ink-soft">
            Nothing in this filter. Switch back to “All” to see the full set.
          </p>
        ) : null}

        <div className="mt-5 space-y-3">
          {results.map((result) => {
            const isOpen = activeQuestionId === result.questionId;
            return (
              <article
                key={result.questionId}
                className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_6px_18px_rgba(20,20,30,0.035)]"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setHasToggledQuestion(true);
                    setOpenQuestionId(isOpen ? null : result.questionId);
                  }}
                  className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      result.isCorrect
                        ? "bg-success-tint text-success"
                        : "bg-danger-tint text-danger"
                    }`}
                  >
                    {result.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <CircleX className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-mute">
                      <span>
                        Question {result.position} · {result.difficulty} ·{" "}
                        {result.bloomLevel}
                      </span>
                      <ConfidenceBadge calibration={result.calibration} />
                    </span>
                    <span className="mt-1 block text-sm font-bold leading-6 text-ink">
                      {result.questionText}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-ink-mute transition ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen ? (
                  <div className="border-t border-hairline px-5 pb-6 pt-5 sm:px-6">
                    <AttemptResultQuestionRow
                      isCorrect={result.isCorrect}
                      yourAnswer={result.selectedOption ?? "Not answered"}
                      correctAnswer={result.correctOption}
                    />
                    <div className="mt-4 rounded-xl border border-hairline bg-canvas p-4">
                      <p className="text-xs font-medium text-ink-mute">
                        Explanation
                      </p>
                      <StudyMarkdown className="mt-2 text-sm leading-6 text-ink-soft">
                        {result.solution}
                      </StudyMarkdown>
                    </div>
                    {result.conceptTags.length > 0 ||
                    result.commonErrors.length > 0 ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {result.conceptTags.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium text-ink-mute">
                              Concepts
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {result.conceptTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {result.commonErrors.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium text-ink-mute">
                              Common traps
                            </p>
                            <ul className="mt-2 space-y-1 text-sm leading-5 text-ink-soft">
                              {result.commonErrors.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <ExplainThis
                      endpoint={`/api/practice/sessions/${attemptId}/questions/${result.id}/explain`}
                    />
                    {!result.isCorrect ? (
                      <TargetedPracticeCard
                        reason="SIMILAR"
                        focusText={result.questionText}
                        scope={scope}
                        sourceQuestionId={result.id}
                        bloomLevel={result.bloomLevel}
                        difficulty={result.difficulty}
                        triggerLabel="Try a similar one"
                      />
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
