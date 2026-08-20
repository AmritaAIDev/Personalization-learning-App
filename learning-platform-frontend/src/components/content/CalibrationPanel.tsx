"use client";

import { useCallback, useState } from "react";
import { CircleAlert, Gauge, LoaderCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useApiResource } from "@/lib/useApiResource";
import type {
  AdminQuestionRecord,
  DifficultyCalibrationRow,
} from "@/lib/question-review-types";
import QuestionForm, {
  type QuestionFormPayload,
} from "@/components/content/QuestionForm";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

/**
 * Surfaces published questions whose tagged difficulty doesn't match how
 * students have actually performed on them (e.g. "Easy" that almost nobody
 * gets right). Read-only signal — nothing here changes a tag automatically,
 * it just points an admin at what's worth re-tagging.
 */
export default function CalibrationPanel() {
  const fetchCalibration = useCallback(
    () => apiFetch<DifficultyCalibrationRow[]>("/api/questions/calibration"),
    [],
  );
  const {
    data,
    loading,
    error: loadError,
    reload: load,
  } = useApiResource(
    fetchCalibration,
    "The calibration report could not be loaded.",
  );
  const rows = data ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<AdminQuestionRecord | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const error = saveError ?? loadError;

  const startEdit = async (questionId: string) => {
    setEditingId(questionId);
    setEditingRecord(null);
    try {
      const record = await apiFetch<AdminQuestionRecord>(
        `/api/questions/bank/${questionId}`,
      );
      setEditingRecord(record);
    } catch {
      setEditingId(null);
    }
  };

  const saveEdit = async (questionId: string, payload: QuestionFormPayload) => {
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch(`/api/questions/bank/${questionId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setEditingId(null);
      setEditingRecord(null);
      await load();
    } catch (reason) {
      setSaveError(
        reason instanceof Error ? reason.message : "The edit could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...rows].sort((a, b) => {
    if (a.mismatched !== b.mismatched) return a.mismatched ? -1 : 1;
    return b.sampleSize - a.sampleSize;
  });
  const mismatchedCount = rows.filter((row) => row.mismatched).length;

  return (
    <section className="rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
          <Gauge className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-bold text-ink">
            Difficulty calibration
          </h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Published questions whose tagged difficulty doesn&apos;t match
            observed student performance (at least 10 answers). Nothing here
            changes automatically — edit a tag if it looks wrong.
          </p>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-3 py-3 text-sm font-semibold text-danger"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-5 space-y-3" aria-label="Loading calibration report">
          <div className="h-16 rounded-2xl skeleton" />
          <div className="h-16 rounded-2xl skeleton" />
          <div className="h-16 rounded-2xl skeleton" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-5 rounded-xl bg-canvas px-4 py-8 text-center text-sm leading-6 text-ink-soft">
          No published question has enough answers yet to check calibration.
        </p>
      ) : (
        <>
          <p className="mt-5 text-sm font-semibold text-ink">
            {mismatchedCount} of {rows.length} question
            {rows.length === 1 ? "" : "s"} flagged.
          </p>
          <div className="mt-3 space-y-3">
            {sorted.map((row) => (
              <article
                key={row.id}
                className={`rounded-2xl border p-4 ${
                  row.mismatched
                    ? "border-danger/25 bg-danger-tint/40"
                    : "border-hairline bg-surface"
                }`}
              >
                {editingId === row.question_id ? (
                  editingRecord ? (
                    <QuestionForm
                      initial={editingRecord}
                      submitting={saving}
                      submitLabel="Save changes"
                      onSubmit={(payload) => saveEdit(row.question_id, payload)}
                      onCancel={() => {
                        setEditingId(null);
                        setEditingRecord(null);
                      }}
                    />
                  ) : (
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                      <LoaderCircle
                        className="h-4 w-4 animate-spin text-primary"
                        aria-hidden="true"
                      />
                      Loading question…
                    </p>
                  )
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        <span
                          className={`rounded-full px-2.5 py-1 ${
                            row.mismatched
                              ? "bg-danger-tint text-danger"
                              : "bg-canvas text-ink-soft"
                          }`}
                        >
                          {row.mismatched ? "Mismatched" : "OK"}
                        </span>
                        <span className="rounded-full bg-canvas px-2.5 py-1 text-ink-soft">
                          Tagged {row.difficulty}
                        </span>
                        <span className="rounded-full bg-canvas px-2.5 py-1 text-ink-soft">
                          {formatPercent(row.observedAccuracy)} correct over{" "}
                          {row.sampleSize} answers
                        </span>
                        <span className="rounded-full bg-canvas px-2.5 py-1 text-ink-soft">
                          Expected {formatPercent(row.expectedRange[0])}–
                          {formatPercent(row.expectedRange[1])}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-medium text-ink-mute">
                        {row.chapter} · {row.topic}
                      </p>
                      <h3 className="mt-1 text-sm font-bold leading-6 text-ink">
                        {row.question_text}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => void startEdit(row.question_id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-hairline px-3 py-2 text-xs font-bold text-ink-soft hover:bg-canvas"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
