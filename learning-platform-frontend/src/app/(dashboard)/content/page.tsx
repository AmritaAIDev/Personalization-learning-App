"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Archive,
  CheckCircle2,
  CircleAlert,
  Flag,
  FilePenLine,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type {
  AdminQuestionRecord,
  QuestionReport,
  QuestionReviewStatus,
} from "@/lib/question-review-types";

const REPORT_REASON_LABELS: Record<QuestionReport["reason"], string> = {
  WRONG_ANSWER: "Answer key looks wrong",
  CONFUSING_WORDING: "Confusing or unclear",
  TYPO_OR_FORMATTING: "Typo or formatting issue",
  OTHER: "Something else",
};

const statusOptions: QuestionReviewStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];
const bloomLevels = ["Recall", "Comprehension", "Application", "Higher-Order"];
const difficulties = ["Easy", "Medium", "Hard"];

export default function ContentReviewPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<QuestionReviewStatus>("DRAFT");
  const [records, setRecords] = useState<AdminQuestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: "Physics",
    chapter: "Electric Charges and Fields",
    topic: "Coulomb's Law and Charge",
    bloomLevel: "Application",
    difficulty: "Medium",
  });
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    void apiFetch<AdminQuestionRecord[]>(
      `/api/questions/review?status=${status}&limit=25`,
    )
      .then((data) => {
        if (active) {
          setRecords(data);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "The review queue could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status, user?.role]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    void apiFetch<QuestionReport[]>("/api/questions/reports?status=OPEN")
      .then((data) => {
        if (active) setReports(data);
      })
      .catch(() => {
        // Non-critical panel; the main review queue above already surfaces errors.
      })
      .finally(() => {
        if (active) setReportsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.role]);

  const resolveReport = async (
    reportId: string,
    action: "DISMISS" | "RESOLVE",
  ) => {
    setResolvingReportId(reportId);
    try {
      await apiFetch(`/api/questions/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setReports((current) => current.filter((report) => report.id !== reportId));
    } catch {
      // Leave the report in the list; the reviewer can retry.
    } finally {
      setResolvingReportId(null);
    }
  };

  const generateDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const draft = await apiFetch<AdminQuestionRecord>(
        "/api/questions/generate",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      if (status === "DRAFT") setRecords((current) => [draft, ...current]);
      setNotice(
        "A generated question was saved as a draft. Review it before publishing.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The draft could not be generated.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const updatePublication = async (
    questionId: string,
    action: "PUBLISH" | "ARCHIVE",
  ) => {
    setActingId(questionId);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiFetch<AdminQuestionRecord>(
        `/api/questions/bank/${questionId}/publication`,
        { method: "PATCH", body: JSON.stringify({ action }) },
      );
      const nextStatus = updated.status;
      setRecords((current) =>
        nextStatus === status
          ? current.map((record) =>
              record.question_id === questionId ? updated : record,
            )
          : current.filter((record) => record.question_id !== questionId),
      );
      setNotice(
        action === "PUBLISH"
          ? "The question is now published for eligible learner flows."
          : "The question was archived and is no longer learner-visible.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The question status could not be updated.",
      );
    } finally {
      setActingId(null);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl items-center p-6 sm:p-10">
        <section className="w-full rounded-[2rem] border border-hairline bg-surface p-8 text-center shadow-[0_18px_45px_rgba(20,20,30,0.07)] sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-tint text-primary">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-ink">
            Reviewer access required
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-ink-soft">
            Question generation and answer-key review are deliberately
            restricted to approved content reviewers.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <header className="flex flex-col gap-4 border-b border-hairline pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[13px] font-medium text-ink-mute">
            Content governance
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Question review studio
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            Review, publish, and archive learner-ready questions.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-primary-tint px-3 py-2 text-xs font-bold text-emerald-800 lg:self-auto">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin-only
          workflow
        </span>
      </header>

      <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <form
          onSubmit={(event) => void generateDraft(event)}
          className="rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
              <FilePenLine className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">
                Generate a review draft
              </h2>
              <p className="mt-0.5 text-sm text-ink-soft">
                The model must return four validated options and a reasoned
                explanation.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                Subject
              </span>
              <input
                required
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                Chapter
              </span>
              <input
                required
                value={form.chapter}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    chapter: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                Topic
              </span>
              <input
                required
                value={form.topic}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    topic: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-ink">
                  Bloom level
                </span>
                <select
                  value={form.bloomLevel}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bloomLevel: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  {bloomLevels.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-ink">
                  Difficulty
                </span>
                <select
                  value={form.difficulty}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      difficulty: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={generating}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.22)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <LoaderCircle
                className="h-5 w-5 animate-spin"
                aria-hidden="true"
              />
            ) : null}{" "}
            Generate draft
          </button>
        </form>

        <section className="rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-hairline pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">
                Review queue
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Showing the most recently updated records.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft">
              <span className="sr-only">Question status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as QuestionReviewStatus)
                }
                className="rounded-xl border border-hairline bg-surface px-3 py-2 text-sm font-bold text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {statusOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <p
              className="mt-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700"
              role="alert"
            >
              <CircleAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          )}
          {notice && (
            <p
              className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800"
              role="status"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {notice}
            </p>
          )}
          {loading ? (
            <div className="grid min-h-56 place-items-center text-sm font-semibold text-ink-soft">
              <span className="flex items-center gap-2">
                <LoaderCircle
                  className="h-4 w-4 animate-spin text-primary"
                  aria-hidden="true"
                />{" "}
                Loading review queue
              </span>
            </div>
          ) : records.length === 0 ? (
            <p className="mt-5 rounded-xl bg-canvas px-4 py-8 text-center text-sm leading-6 text-ink-soft">
              There are no {status.toLowerCase()} questions in this queue.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {records.map((record) => (
                <article
                  key={record.id}
                  className="rounded-2xl border border-hairline bg-surface p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-primary-tint px-2.5 py-1 text-primary-strong">
                          {record.status}
                        </span>
                        <span className="rounded-full bg-canvas px-2.5 py-1 text-ink-soft">
                          {record.source === "AI_GENERATED"
                            ? "AI draft"
                            : "Curated"}
                        </span>
                        <span className="rounded-full bg-canvas px-2.5 py-1 text-ink-soft">
                          Quality {record.quality_score}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-medium text-ink-mute">
                        {record.chapter} · {record.bloom_level} ·{" "}
                        {record.difficulty}
                      </p>
                      <h3 className="mt-1 text-sm font-bold leading-6 text-ink">
                        {record.question_text}
                      </h3>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {record.status !== "PUBLISHED" && (
                        <button
                          type="button"
                          disabled={actingId === record.question_id}
                          onClick={() =>
                            void updatePublication(
                              record.question_id,
                              "PUBLISH",
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-strong disabled:opacity-60"
                        >
                          {actingId === record.question_id ? (
                            <LoaderCircle
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <CheckCircle2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          )}{" "}
                          Publish
                        </button>
                      )}
                      {record.status !== "ARCHIVED" && (
                        <button
                          type="button"
                          disabled={actingId === record.question_id}
                          onClick={() =>
                            void updatePublication(
                              record.question_id,
                              "ARCHIVE",
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-hairline px-3 py-2 text-xs font-bold text-ink-soft hover:bg-canvas disabled:opacity-60"
                        >
                          <Archive className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                  <details className="mt-4 rounded-xl bg-surface">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-bold text-ink-soft">
                      <FilePenLine
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />{" "}
                      Review answer and explanation
                    </summary>
                    <div className="border-t border-hairline p-3">
                      <p className="text-xs font-medium text-ink-mute">
                        Options
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                        {record.options.map((option) => (
                          <li key={option}>{option}</li>
                        ))}
                      </ul>
                      <p className="mt-4 text-[13px] font-medium text-emerald-700">
                        Correct answer
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-900">
                        {record.correct_answer}
                      </p>
                      <p className="mt-4 text-xs font-medium text-ink-mute">
                        Explanation
                      </p>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">
                        {record.solution}
                      </p>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <Flag className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold text-ink">
              Reported questions
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              Student-flagged issues, including the real-time AI practice
              pool that can&apos;t be reviewed before it reaches a learner.
            </p>
          </div>
        </div>

        {reportsLoading ? (
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <LoaderCircle
              className="h-4 w-4 animate-spin text-primary"
              aria-hidden="true"
            />
            Loading reports
          </div>
        ) : reports.length === 0 ? (
          <p className="mt-5 rounded-xl bg-canvas px-4 py-8 text-center text-sm leading-6 text-ink-soft">
            No open reports right now.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-hairline bg-surface p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                        {REPORT_REASON_LABELS[report.reason]}
                      </span>
                      <span className="rounded-full bg-canvas px-2.5 py-1 text-ink-soft">
                        {report.questionSource === "AI_POOL"
                          ? "AI practice pool"
                          : "Curated"}
                      </span>
                    </div>
                    {report.questionPreview ? (
                      <>
                        <p className="mt-3 text-xs font-medium text-ink-mute">
                          {report.questionPreview.chapter} ·{" "}
                          {report.questionPreview.topic}
                        </p>
                        <h3 className="mt-1 text-sm font-bold leading-6 text-ink">
                          {report.questionPreview.text}
                        </h3>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-ink-mute">
                        The reported question is no longer available.
                      </p>
                    )}
                    {report.details ? (
                      <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-xs leading-5 text-ink-soft">
                        &ldquo;{report.details}&rdquo;
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={resolvingReportId === report.id}
                      onClick={() => void resolveReport(report.id, "RESOLVE")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-strong disabled:opacity-60"
                    >
                      {resolvingReportId === report.id ? (
                        <LoaderCircle
                          className="h-3.5 w-3.5 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <CheckCircle2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      )}{" "}
                      Resolved
                    </button>
                    <button
                      type="button"
                      disabled={resolvingReportId === report.id}
                      onClick={() => void resolveReport(report.id, "DISMISS")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-hairline px-3 py-2 text-xs font-bold text-ink-soft hover:bg-canvas disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Dismiss
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
