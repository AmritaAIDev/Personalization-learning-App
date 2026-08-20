import type { ReactNode } from "react";

interface AttemptResultQuestionRowProps {
  isCorrect: boolean | null;
  yourAnswer: ReactNode;
  correctAnswer: ReactNode;
}

/**
 * Shared "your answer / correct answer" comparison block for post-attempt
 * review lists. Each screen keeps its own outer header/toggle/filter
 * interaction (they're genuinely different UX patterns) and renders this
 * for the answer-comparison body once expanded.
 */
export default function AttemptResultQuestionRow({
  isCorrect,
  yourAnswer,
  correctAnswer,
}: AttemptResultQuestionRowProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div
        className={`rounded-xl border px-3 py-2 ${
          isCorrect === false
            ? "border-danger/25 bg-danger-tint"
            : "border-hairline bg-surface"
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
          Your answer
        </p>
        <p className="mt-0.5 text-[13px] font-semibold text-ink-soft">
          {yourAnswer ?? "Not answered"}
        </p>
      </div>
      <div className="rounded-xl border border-success/25 bg-success-tint px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-success">
          Correct answer
        </p>
        <p className="mt-0.5 text-[13px] font-semibold text-success">
          {correctAnswer}
        </p>
      </div>
    </div>
  );
}
