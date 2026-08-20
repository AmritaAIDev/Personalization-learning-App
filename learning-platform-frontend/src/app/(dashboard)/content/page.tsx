"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Archive,
  CheckCircle2,
  CircleAlert,
  Flag,
  FilePenLine,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  AdminQuestionRecord,
  ContentStats,
  QuestionReport,
  QuestionReviewStatus,
} from "@/lib/question-review-types";
import QuestionForm, {
  type QuestionFormPayload,
} from "@/components/content/QuestionForm";
import BulkImportPanel from "@/components/content/BulkImportPanel";
import CalibrationPanel from "@/components/content/CalibrationPanel";
import GenerationStudio from "@/components/content/GenerationStudio";
import SyllabusPanel from "@/components/content/SyllabusPanel";

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

type ContentTab =
  | "syllabus"
  | "review"
  | "generate"
  | "add"
  | "bulk"
  | "calibration"
  | "reports";

const TABS: Array<{ value: ContentTab; label: string }> = [
  { value: "generate", label: "AI studio" },
  { value: "syllabus", label: "Syllabus" },
  { value: "review", label: "Review queue" },
  { value: "add", label: "Add question" },
  { value: "bulk", label: "Bulk import" },
  { value: "calibration", label: "Calibration" },
  { value: "reports", label: "Reports" },
];

export default function ContentReviewPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<ContentTab>("generate");
  const [status, setStatus] = useState<QuestionReviewStatus>("DRAFT");
  const [records, setRecords] = useState<AdminQuestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    setLoading(true);
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

  const loadStats = () => {
    if (user?.role !== "admin") return;
    void apiFetch<ContentStats>("/api/questions/stats", { memoryCacheTtlMs: 0 })
      .then((data) => setStats(data))
      .catch(() => {
        // Non-critical header panel; the tabs below still function without it.
      });
  };

  useEffect(loadStats, [user?.role]);

  const createQuestion = async (payload: QuestionFormPayload) => {
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const created = await apiFetch<AdminQuestionRecord>(
        "/api/questions/bank",
        { method: "POST", body: JSON.stringify(payload) },
      );
      if (status === "DRAFT") setRecords((current) => [created, ...current]);
      setNotice("The question was saved as a draft. Review it before publishing.");
      setTab("review");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The question could not be saved.",
      );
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async (questionId: string, payload: QuestionFormPayload) => {
    setSavingEditId(questionId);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiFetch<AdminQuestionRecord>(
        `/api/questions/bank/${questionId}`,
        { method: "PATCH", body: JSON.stringify(payload) },
      );
      setRecords((current) =>
        current.map((record) =>
          record.question_id === questionId ? updated : record,
        ),
      );
      setNotice("The question was updated.");
      setEditingId(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The edit could not be saved.",
      );
    } finally {
      setSavingEditId(null);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    setDeletingId(questionId);
    setDeleteErrors((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
    try {
      await apiFetch(`/api/questions/bank/${questionId}`, { method: "DELETE" });
      setRecords((current) =>
        current.filter((record) => record.question_id !== questionId),
      );
    } catch (reason) {
      setDeleteErrors((current) => ({
        ...current,
        [questionId]:
          reason instanceof ApiError
            ? reason.message
            : "The question could not be deleted.",
      }));
    } finally {
      setDeletingId(null);
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
          <h1 className="mt-2 font-heading page-title text-ink">
            Content studio
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            Generate, review, and publish learner-ready questions — batch AI
            drafting first, hand-authoring and imports when you need them.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-primary-tint px-3 py-2 text-xs font-bold text-primary lg:self-auto">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin-only
          workflow
        </span>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ContentStatCard
          icon={<FilePenLine className="h-4 w-4" aria-hidden="true" />}
          label="Drafts"
          value={stats?.drafts ?? "—"}
        />
        <ContentStatCard
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          label="Published"
          value={stats?.published ?? "—"}
        />
        <ContentStatCard
          icon={<Archive className="h-4 w-4" aria-hidden="true" />}
          label="Archived"
          value={stats?.archived ?? "—"}
        />
        <ContentStatCard
          icon={<Flag className="h-4 w-4" aria-hidden="true" />}
          label="Open reports"
          value={stats?.openReports ?? "—"}
        />
      </div>

      <nav
        role="tablist"
        aria-label="Content tools"
        className="mt-6 flex flex-wrap gap-1 rounded-2xl border border-hairline bg-surface p-1 shadow-[0_8px_22px_rgba(20,20,30,0.04)]"
      >
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-bold transition-colors sm:flex-none sm:px-4 ${
              tab === value
                ? "bg-primary text-white"
                : "text-ink-soft hover:bg-canvas hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {error ? (
        <p
          className="mt-6 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-3 py-3 text-sm font-semibold text-danger"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="mt-6 flex items-start gap-2 rounded-xl border border-success/20 bg-success-tint px-3 py-3 text-sm font-semibold text-success"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      {tab === "syllabus" ? <SyllabusPanel /> : null}

      {tab === "generate" ? (
        <GenerationStudio onQuestionPublished={loadStats} />
      ) : null}

      {tab === "add" ? (
        <section className="mt-6 rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
              <FilePenLine className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">
                Add a question
              </h2>
              <p className="mt-0.5 text-sm text-ink-soft">
                Hand-typed curated questions land as drafts, same as generated
                ones — review and publish from the queue.
              </p>
            </div>
          </div>
          <div className="mt-6 max-w-2xl">
            <QuestionForm
              submitting={creating}
              submitLabel="Save as draft"
              onSubmit={createQuestion}
            />
          </div>
        </section>
      ) : null}

      {tab === "bulk" ? (
        <div className="mt-6">
          <BulkImportPanel />
        </div>
      ) : null}

      {tab === "calibration" ? (
        <div className="mt-6">
          <CalibrationPanel />
        </div>
      ) : null}

      {tab === "review" ? (
        <section className="mt-6 rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
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
          {loading ? (
            <div className="mt-5 space-y-3" aria-label="Loading review queue">
              <div className="h-24 rounded-2xl skeleton" />
              <div className="h-24 rounded-2xl skeleton" />
              <div className="h-24 rounded-2xl skeleton" />
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
                  {editingId === record.question_id ? (
                    <QuestionForm
                      initial={record}
                      submitting={savingEditId === record.question_id}
                      submitLabel="Save changes"
                      onSubmit={(payload) =>
                        saveEdit(record.question_id, payload)
                      }
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
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
                        <div className="flex shrink-0 flex-wrap gap-2">
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
                          <button
                            type="button"
                            onClick={() => setEditingId(record.question_id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline px-3 py-2 text-xs font-bold text-ink-soft hover:bg-canvas"
                          >
                            <FilePenLine className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                            Edit
                          </button>
                          {record.status === "DRAFT" && (
                            <button
                              type="button"
                              disabled={deletingId === record.question_id}
                              onClick={() => void deleteQuestion(record.question_id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-danger/25 px-3 py-2 text-xs font-bold text-danger hover:bg-danger-tint disabled:opacity-60"
                            >
                              {deletingId === record.question_id ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              )}{" "}
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      {deleteErrors[record.question_id] ? (
                        <p className="mt-3 rounded-xl border border-danger/20 bg-danger-tint px-3 py-2 text-xs font-semibold text-danger">
                          {deleteErrors[record.question_id]}
                        </p>
                      ) : null}
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
                          <p className="mt-4 text-[13px] font-medium text-success">
                            Correct answer
                          </p>
                          <p className="mt-1 text-sm font-semibold text-success">
                            {record.correct_answer}
                          </p>
                          <p className="mt-4 text-xs font-medium text-ink-mute">
                            Explanation
                          </p>
                          <p className="mt-1 text-sm leading-6 text-ink-soft">
                            {record.solution}
                          </p>
                          {record.concept_tags.length > 0 ? (
                            <>
                              <p className="mt-4 text-xs font-medium text-ink-mute">
                                Concept tags
                                {record.source === "AI_GENERATED"
                                  ? " (AI-suggested)"
                                  : ""}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {record.concept_tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-semibold text-primary-strong"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : null}
                          {record.common_errors.length > 0 ? (
                            <>
                              <p className="mt-4 text-xs font-medium text-ink-mute">
                                Common wrong-answer patterns
                                {record.source === "AI_GENERATED"
                                  ? " (AI-suggested)"
                                  : ""}
                              </p>
                              <ul className="mt-2 space-y-1 text-sm leading-5 text-ink-soft">
                                {record.common_errors.map((commonError) => (
                                  <li key={commonError}>• {commonError}</li>
                                ))}
                              </ul>
                            </>
                          ) : null}
                        </div>
                      </details>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "reports" ? (
        <section className="mt-6 rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger-tint text-danger">
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
            <div className="mt-5 space-y-3" aria-label="Loading reports">
              <div className="h-20 rounded-2xl skeleton" />
              <div className="h-20 rounded-2xl skeleton" />
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
                        <span className="rounded-full bg-danger-tint px-2.5 py-1 text-danger">
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
      ) : null}
    </div>
  );
}

function ContentStatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-mute">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary-tint text-primary">
          {icon}
        </span>
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
