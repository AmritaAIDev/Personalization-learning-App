"use client";

import { useState } from "react";
import { CircleAlert, Flag, LoaderCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

type QuestionSource = "CURATED" | "AI_POOL";

type ReportReason =
  | "WRONG_ANSWER"
  | "CONFUSING_WORDING"
  | "TYPO_OR_FORMATTING"
  | "OTHER";

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "WRONG_ANSWER", label: "Answer key looks wrong" },
  { value: "CONFUSING_WORDING", label: "Confusing or unclear" },
  { value: "TYPO_OR_FORMATTING", label: "Typo or formatting issue" },
  { value: "OTHER", label: "Something else" },
];

/**
 * Lets a student flag a question's content — the safety net for AI-pool
 * questions, which are generated and served in real time and can't wait on
 * human review beforehand. Distinct from any "mark for review" (revisit
 * later) affordance elsewhere: this reports a problem with the question
 * itself, not a personal to-do.
 */
export default function ReportQuestionButton({
  questionSource,
  questionRefId,
  compact = false,
}: {
  questionSource: QuestionSource;
  questionRefId: string;
  /** Icon-only, for tight header rows. Full label otherwise. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setOpen(false);
    setReason(null);
    setDetails("");
    setError(null);
  };

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/questions/report", {
        method: "POST",
        body: JSON.stringify({
          questionSource,
          ...(questionSource === "CURATED"
            ? { questionId: questionRefId }
            : { generatedQuestionId: questionRefId }),
          reason,
          details: details.trim() || undefined,
        }),
      });
      setSubmitted(true);
      window.setTimeout(reset, 1800);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The report could not be sent. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Report an issue with this question"
        title="Report an issue with this question"
        className={
          compact
            ? "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-mute transition hover:bg-rose-50 hover:text-rose-700"
            : "inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline px-3 text-xs font-bold text-ink-mute transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        }
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        {compact ? null : "Report an issue"}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-hairline bg-white p-4 shadow-[0_18px_48px_rgba(20,20,30,0.12)]">
          {submitted ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CircleAlert className="h-4 w-4" aria-hidden="true" />
              Thanks — a reviewer will take a look.
            </p>
          ) : (
            <>
              <p className="text-sm font-bold text-ink">
                What&apos;s wrong with this question?
              </p>
              <div className="mt-3 space-y-1.5">
                {REASONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                      reason === option.value
                        ? "border-primary/40 bg-primary-tint text-primary"
                        : "border-hairline text-ink-soft hover:bg-canvas"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={option.value}
                      checked={reason === option.value}
                      onChange={() => setReason(option.value)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Optional details"
                className="mt-3 w-full resize-none rounded-xl border border-hairline bg-canvas px-2.5 py-2 text-xs text-ink outline-none placeholder:text-ink-mute focus:border-primary/40"
              />
              {error ? (
                <p className="mt-2 text-xs font-semibold text-rose-700">
                  {error}
                </p>
              ) : null}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-mute hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!reason || submitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <LoaderCircle
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  Send report
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
