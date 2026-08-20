"use client";

import { type ReactNode, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, LoaderCircle, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  generateTargetedQuestion,
  submitTargetedAnswer,
  type TargetedAnswerResult,
  type TargetedPracticeReason,
  type TargetedQuestion,
} from "@/lib/targeted-practice";

const StudyMarkdown = dynamic(
  () => import("@/components/learning/StudyMarkdown"),
  { ssr: false },
);

export type TargetedPracticeCardProps = {
  reason: TargetedPracticeReason;
  focusText: string;
  scope: { subject: string; chapter: string; topic: string };
  sourceQuestionId?: string;
  bloomLevel?: string;
  difficulty?: string;
  triggerLabel: string;
  /** Optional short line shown above the trigger button, e.g. a repeat count. */
  contextLine?: ReactNode;
};

/**
 * On-demand single AI question generated from a focus hint — either a
 * misconception to remediate (AI Phase 2.2) or a source question to stay
 * isomorphic to (2.3 "try a similar one"). Shared by the Notebook and the
 * practice/diagnostic review screens; deliberately standalone from the
 * adaptive session state machine.
 */
export default function TargetedPracticeCard({
  reason,
  focusText,
  scope,
  sourceQuestionId,
  bloomLevel,
  difficulty,
  triggerLabel,
  contextLine,
}: TargetedPracticeCardProps) {
  const [question, setQuestion] = useState<TargetedQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<TargetedAnswerResult | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "answering" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setStatus("loading");
    setError(null);
    setResult(null);
    setSelected(null);
    try {
      const generated = await generateTargetedQuestion({
        subject: scope.subject,
        chapter: scope.chapter,
        topic: scope.topic,
        reason,
        focusText,
        sourceQuestionId,
        bloomLevel,
        difficulty,
      });
      setQuestion(generated);
      setStatus("idle");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not generate a question right now.",
      );
      setStatus("error");
    }
  };

  const answer = async (option: string) => {
    if (!question || result) return;
    setSelected(option);
    setStatus("answering");
    try {
      const graded = await submitTargetedAnswer(question.id, option);
      setResult(graded);
      setStatus("idle");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not grade that answer.",
      );
      setStatus("error");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-hairline bg-canvas p-3">
      {contextLine ? <div className="mb-2">{contextLine}</div> : null}

      {!question ? (
        <button
          type="button"
          onClick={() => void start()}
          disabled={status === "loading"}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
        >
          {status === "loading" ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {status === "loading" ? "Generating…" : triggerLabel}
        </button>
      ) : (
        <div>
          <StudyMarkdown className="text-[13px] font-semibold leading-6 text-ink">
            {question.questionText}
          </StudyMarkdown>
          <div className="mt-2 grid gap-1.5">
            {question.options.map((option) => {
              const isSelected = selected === option;
              const isAnswerKey = result && option === result.correctAnswer;
              const tone = !result
                ? "border-hairline bg-surface hover:border-primary/40"
                : isAnswerKey
                  ? "border-success bg-success-tint"
                  : isSelected
                    ? "border-danger bg-danger-tint"
                    : "border-hairline bg-surface opacity-60";
              return (
                <button
                  key={option}
                  type="button"
                  disabled={Boolean(result) || status === "answering"}
                  onClick={() => void answer(option)}
                  className={`rounded-lg border px-3 py-2 text-left text-[13px] font-medium text-ink transition ${tone}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {result ? (
            <div className="mt-3 rounded-lg border border-hairline bg-surface p-3">
              <div
                className={`flex items-center gap-1.5 text-[12px] font-bold ${
                  result.isCorrect ? "text-success" : "text-danger"
                }`}
              >
                {result.isCorrect ? (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {result.isCorrect ? "Nice, you've got it" : "Still tricky — see below"}
              </div>
              <StudyMarkdown className="mt-2 text-[13px] leading-5 text-ink-soft">
                {result.solution}
              </StudyMarkdown>
              <button
                type="button"
                onClick={() => void start()}
                className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] font-semibold text-ink-soft transition hover:bg-canvas"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Try another
              </button>
            </div>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="mt-2 text-[12px] font-medium text-danger">{error}</p>
      ) : null}
    </div>
  );
}
