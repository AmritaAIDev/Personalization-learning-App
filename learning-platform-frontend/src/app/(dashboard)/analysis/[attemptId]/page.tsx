"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  LoaderCircle,
  NotebookTabs,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import StudyMarkdown from "@/components/learning/StudyMarkdown";
import ExplainThis from "@/components/learning/ExplainThis";
import ConfidenceBadge from "@/components/diagnostic/ConfidenceBadge";
import type {
  AnalysisPayload,
  DiagnosticReviewItem,
  DiagnosticReviewPayload,
  PerformanceRow,
} from "@/lib/diagnostic-types";
import { formatDateTime } from "@/lib/format";
import BloomRadar from "@/components/diagnostic/BloomRadar";
import PerformanceBars from "@/components/diagnostic/PerformanceBars";
import ScoreRing from "@/components/diagnostic/ScoreRing";

const gradeMessage = {
  Excellent:
    "You have a strong command of the measured Electrostatics concepts.",
  Good: "Your foundation is sound; use the topic breakdown to sharpen the remaining gaps.",
  Average:
    "You have important working knowledge and clear opportunities to consolidate it.",
  "Needs work":
    "Use the recommended resources to rebuild the concepts before your next attempt.",
};

const ELECTROSTATICS_SCOPE = {
  subject: "Physics",
  chapter: "Electrostatics",
};

function topicPracticeHref(topic: string) {
  const params = new URLSearchParams({
    ...ELECTROSTATICS_SCOPE,
    topic,
  });
  return `/practice?${params.toString()}`;
}

function topicLearnHref(topic: string) {
  const params = new URLSearchParams({
    ...ELECTROSTATICS_SCOPE,
    topic,
    tab: "practice",
  });
  return `/learn?${params.toString()}`;
}

function getPriorityRows(rows: PerformanceRow[]) {
  return [...rows]
    .filter((row) => row.total > 0)
    .sort((left, right) => left.score - right.score)
    .slice(0, 4);
}

function AnalysisSkeleton() {
  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <div className="h-8 w-32 animate-pulse rounded-full bg-ink/10" />
      <section className="mt-7 rounded-[1.9rem] bg-ink p-8">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="h-40 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-4">
            <div className="h-5 w-36 animate-pulse rounded-full bg-white/15" />
            <div className="h-10 w-64 animate-pulse rounded-full bg-white/15" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </section>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl bg-ink/8" />
        ))}
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const params = useParams<{ attemptId: string }>();
  const { user } = useAuth();
  const [result, setResult] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!params.attemptId) return;
    setLoading(true);
    setError(null);
    try {
      setResult(
        await apiFetch<AnalysisPayload>(
          `/api/diagnostics/${params.attemptId}/analysis`,
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Unable to load this analysis.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.attemptId]);

  useEffect(() => {
    const loadInitialAnalysis = async () => {
      await load();
    };
    void loadInitialAnalysis();
  }, [load]);

  const priorityRows = useMemo(
    () => getPriorityRows(result?.analysis.topicPerformance ?? []),
    [result],
  );

  if (loading) return <AnalysisSkeleton />;

  if (!result) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
        <CircleAlert className="h-8 w-8 text-rose-600" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-ink">
          Analysis unavailable
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          {error ?? "Please try again."}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    );
  }

  const { analysis, attempt } = result;
  const hasWeakTopics = analysis.weakTopics.length > 0;

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
        <Link
          href="/tests"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to tests
        </Link>
        <section className="relative mt-7 overflow-hidden rounded-[1.9rem] bg-ink p-7 text-white shadow-[0_22px_70px_rgba(20,20,30,0.16)] sm:p-9">
          <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative grid gap-7 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <ScoreRing score={analysis.scorePercent} />
            <div>
              <p className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/55">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                Diagnostic complete
              </p>
              <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
                {analysis.grade}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                {gradeMessage[analysis.grade]}
              </p>
              <p className="mt-5 text-sm font-semibold text-white">
                {analysis.correct} correct · {analysis.incorrect} incorrect ·{" "}
                {analysis.total} total
              </p>
              {analysis.recap ? (
                <p className="mt-4 flex items-start gap-2 rounded-2xl bg-white/8 px-4 py-3 text-sm font-medium leading-6 text-white/85">
                  <Sparkles
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-bold text-white">AI recap:</span>{" "}
                    {analysis.recap}
                  </span>
                </p>
              ) : null}
            </div>
            <div className="self-start rounded-2xl bg-white/8 px-4 py-3 text-xs font-semibold text-white/70">
              Submitted {formatDateTime(attempt.submittedAt)}
            </div>
          </div>
        </section>
        <section
          className="mt-5 grid gap-4 sm:grid-cols-3"
          aria-label="Score summary"
        >
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-800">
              Correct answers
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold text-emerald-950">
              {analysis.correct}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-800">
              Incorrect answers
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold text-rose-950">
              {analysis.incorrect}
            </p>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-[0_10px_24px_rgba(20,20,30,0.04)]">
            <p className="text-sm font-semibold text-ink-mute">
              Topics to repair
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold text-primary">
              {analysis.weakTopics.length}
            </p>
          </div>
        </section>
        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.78fr)]">
          <div className="space-y-5">
            <PerformanceBars
              title="Topic performance"
              description="Strong: 70% or higher · Average: 40–69% · Weak: below 40%. Recommendations use the under-50% threshold from the diagnostic."
              rows={analysis.topicPerformance}
            />
            <PerformanceBars
              title="Priority topic profile"
              description="Lowest scoring measured topics are shown first, so the repair block is easier to choose."
              rows={
                priorityRows.length ? priorityRows : analysis.topicPerformance
              }
            />
          </div>

          <div className="space-y-5">
            <BloomRadar rows={analysis.bloomPerformance} />
            <section className="rounded-2xl border border-hairline bg-surface p-6 shadow-[0_8px_22px_rgba(20,20,30,0.04)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
                Repair priority
              </p>
              <h2 className="mt-2 font-heading text-xl font-semibold text-ink">
                {hasWeakTopics
                  ? "Start with the weakest concepts"
                  : "Maintain your strong route"}
              </h2>
              <div className="mt-4 space-y-3">
                {hasWeakTopics ? (
                  analysis.weakTopics.map((topic) => (
                    <div
                      key={topic}
                      className="rounded-2xl border border-hairline bg-canvas p-4"
                    >
                      <p className="text-sm font-semibold text-ink">{topic}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={topicLearnHref(topic)}
                          className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90"
                        >
                          Open tutor practice
                          <ArrowRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </Link>
                        <Link
                          href={topicPracticeHref(topic)}
                          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
                        >
                          Reviewed practice
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-hairline bg-canvas p-4 text-sm leading-6 text-ink-mute">
                    No weak topic was flagged. Keep rotating through Practice
                    and Notebook to protect recall.
                  </p>
                )}
              </div>
            </section>
          </div>
        </section>
        {user?.role === "admin" && analysis.integrity?.guessingSuspected ? (
          <section
            className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5"
            aria-label="Admin integrity signal"
          >
            <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Possible guess pattern (admin only)
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900/90">
              {analysis.integrity.note}
            </p>
            <p className="mt-2 text-xs text-amber-800/80">
              Heuristic signal, not a certainty — never shown to the learner.
            </p>
          </section>
        ) : null}
        <ReviewSection attemptId={attempt.id} />
        <section className="mt-5 rounded-2xl border border-hairline bg-surface p-6 shadow-[0_8px_22px_rgba(20,20,30,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                Your next step
              </p>
              <h2 className="mt-2 font-heading text-xl font-semibold text-ink">
                {hasWeakTopics
                  ? "Repair before retesting."
                  : "Keep reinforcing your strong foundation."}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-soft">
                {hasWeakTopics
                  ? analysis.weakTopics.join(" · ")
                  : "Use general revision resources, then take another reviewed practice set."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/recommendations/${attempt.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                View recommendations
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/notebook"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-hairline px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
              >
                <NotebookTabs className="h-4 w-4" aria-hidden="true" />
                Notebook
              </Link>
              <Link
                href="/diagnostic"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-hairline px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retake
              </Link>
            </div>
          </div>
        </section>
        <p className="mt-5 flex items-center gap-2 text-xs text-ink-mute">
          <CheckCircle2
            className="h-4 w-4 text-emerald-600"
            aria-hidden="true"
          />
          This report is derived from answers saved to your account, not
          client-side scoring.
        </p>
        <p className="mt-2 flex items-center gap-2 text-xs text-ink-mute">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
          Weak-topic actions route into the learning and practice flows instead
          of ending at a static score.
        </p>
      </main>
    </div>
  );
}

function ReviewSection({ attemptId }: { attemptId: string }) {
  const [review, setReview] = useState<DiagnosticReviewItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<DiagnosticReviewPayload>(
        `/api/diagnostics/${attemptId}/review`,
      );
      setReview(data.questions);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Unable to load the review.",
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !review && !loading) void load();
  };

  return (
    <section className="mt-5 rounded-2xl border border-hairline bg-surface p-5 shadow-[0_8px_22px_rgba(20,20,30,0.04)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-mute">
            Question review
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-ink">
            Review every question with its solution
          </h2>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-hairline px-4 py-2 text-sm font-bold text-ink-soft transition hover:bg-canvas"
        >
          {open ? "Hide review" : "Show review"}
        </button>
      </div>

      {open ? (
        <div className="mt-4">
          {loading ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <LoaderCircle
                className="h-4 w-4 animate-spin text-primary"
                aria-hidden="true"
              />
              Loading questions…
            </p>
          ) : null}
          {error ? (
            <p
              className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
              role="alert"
            >
              <CircleAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          ) : null}
          {review ? (
            <ol className="grid gap-3">
              {review.map((item) => (
                <li
                  key={item.questionId}
                  className="rounded-xl border border-hairline bg-canvas p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
                    <span className="text-ink-mute">Q{item.position}</span>
                    <span className="rounded-full bg-primary-tint px-2 py-0.5 text-primary">
                      {item.difficulty}
                    </span>
                    <span className="text-ink-mute">{item.bloomLevel}</span>
                    <span
                      className={`ml-auto rounded-full px-2.5 py-0.5 ${
                        item.isCorrect
                          ? "bg-emerald-100 text-emerald-700"
                          : item.selectedOption
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.isCorrect
                        ? "Correct"
                        : item.selectedOption
                          ? "Incorrect"
                          : "Unanswered"}
                    </span>
                    <ConfidenceBadge calibration={item.calibration} />
                  </div>
                  <StudyMarkdown className="mt-2 text-sm font-semibold leading-6 text-ink">
                    {item.questionText}
                  </StudyMarkdown>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div
                      className={`rounded-xl border px-3 py-2 ${
                        item.selectedOption && !item.isCorrect
                          ? "border-rose-200/60 bg-rose-50"
                          : "border-hairline bg-surface"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
                        Your answer
                      </p>
                      <StudyMarkdown className="mt-0.5 text-[13px] font-semibold text-ink-soft">
                        {item.selectedOption ?? "Not answered"}
                      </StudyMarkdown>
                    </div>
                    <div className="rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                        Correct answer
                      </p>
                      <StudyMarkdown className="mt-0.5 text-[13px] font-semibold text-emerald-800">
                        {item.correctOption}
                      </StudyMarkdown>
                    </div>
                  </div>
                  <details className="mt-3 rounded-xl border border-hairline bg-surface px-3 py-2">
                    <summary className="cursor-pointer text-[13px] font-semibold text-ink">
                      View worked solution
                    </summary>
                    <StudyMarkdown className="mt-2 text-[13px] leading-5 text-ink-soft">
                      {item.solution}
                    </StudyMarkdown>
                  </details>
                  <ExplainThis
                    endpoint={`/api/diagnostics/${attemptId}/questions/${item.id}/explain`}
                  />
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
