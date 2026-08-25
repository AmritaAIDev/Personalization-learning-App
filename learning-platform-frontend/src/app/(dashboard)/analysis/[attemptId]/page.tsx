"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import { friendlyBloomLabel } from "@/lib/learning";
import { useAuth } from "@/context/AuthContext";
import ExplainThis from "@/components/learning/ExplainThis";
import TargetedPracticeCard from "@/components/learning/TargetedPracticeCard";
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
import AttemptResultHero from "@/components/results/AttemptResultHero";
import AttemptResultStatRow from "@/components/results/AttemptResultStatRow";
import AttemptResultQuestionRow from "@/components/results/AttemptResultQuestionRow";

const StudyMarkdown = dynamic(
  () => import("@/components/learning/StudyMarkdown"),
  { ssr: false },
);

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
      <div className="h-8 w-32 animate-pulse rounded-full bg-ink-solid/10" />
      <section className="mt-7 rounded-[1.9rem] bg-ink-solid p-8">
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
          <div key={item} className="h-28 animate-pulse rounded-2xl bg-ink-solid/8" />
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
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("The review is taking longer than expected. Please try again.");
    }, 15000);
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
      clearTimeout(timeout);
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
        <CircleAlert className="h-8 w-8 text-danger" aria-hidden="true" />
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
        <div className="mt-7">
          <AttemptResultHero
            icon={ClipboardList}
            eyebrow="Diagnostic complete"
            score={<ScoreRing score={analysis.scorePercent} />}
            title={analysis.grade}
            statsLine={`${analysis.correct} correct · ${analysis.incorrect} incorrect · ${analysis.total} total`}
            caption={
              analysis.recap ? (
                <>
                  <Sparkles
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-bold text-white">AI recap:</span>{" "}
                    {analysis.recap}
                  </span>
                </>
              ) : undefined
            }
            corner={`Submitted ${formatDateTime(attempt.submittedAt)}`}
          />
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            {gradeMessage[analysis.grade]}
          </p>
        </div>
        <AttemptResultStatRow
          stats={[
            { label: "Correct answers", value: analysis.correct, tone: "positive" },
            { label: "Incorrect answers", value: analysis.incorrect, tone: "negative" },
            { label: "Topics to repair", value: analysis.weakTopics.length, tone: "neutral" },
          ]}
        />
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
            <BloomRadar
              rows={analysis.bloomPerformance.map((row) => ({
                ...row,
                label: friendlyBloomLabel(row.label),
              }))}
            />
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
                          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
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
            className="mt-5 rounded-2xl border border-warning/25 bg-warning-tint p-5"
            aria-label="Admin integrity signal"
          >
            <p className="flex items-center gap-2 text-sm font-bold text-warning">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Possible guess pattern (admin only)
            </p>
            <p className="mt-2 text-sm leading-6 text-warning/90">
              {analysis.integrity.note}
            </p>
            <p className="mt-2 text-xs text-warning/80">
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
            className="h-4 w-4 text-success"
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
              className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-3 py-2 text-sm font-medium text-danger"
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
                    <span className="text-ink-mute">
                      {friendlyBloomLabel(item.bloomLevel)}
                    </span>
                    <span
                      className={`ml-auto rounded-full px-2.5 py-0.5 ${
                        item.isCorrect
                          ? "bg-success-tint text-success"
                          : item.selectedOption
                            ? "bg-danger-tint text-danger"
                            : "bg-warning-tint text-warning"
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
                  <div className="mt-3">
                    <AttemptResultQuestionRow
                      isCorrect={item.isCorrect}
                      yourAnswer={
                        <StudyMarkdown>
                          {item.selectedOption ?? "Not answered"}
                        </StudyMarkdown>
                      }
                      correctAnswer={
                        <StudyMarkdown>{item.correctOption}</StudyMarkdown>
                      }
                    />
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
                  {!item.isCorrect ? (
                    <TargetedPracticeCard
                      reason="SIMILAR"
                      focusText={item.questionText}
                      scope={{
                        subject: item.subject,
                        chapter: item.chapter,
                        topic: item.topic,
                      }}
                      sourceQuestionId={item.id}
                      bloomLevel={item.bloomLevel}
                      difficulty={item.difficulty}
                      triggerLabel="Try a similar one"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
