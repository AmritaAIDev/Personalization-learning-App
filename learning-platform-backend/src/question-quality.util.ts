export interface QualityScoreInput {
  question_text: string;
  options: string[];
  explanation: string;
}

/**
 * A cheap structural-quality heuristic for AI-generated content: four
 * genuinely distinct options, a substantive explanation, and a grounded
 * (non-trivial) prompt. It cannot judge factual correctness, only catch the
 * shape of a low-effort generation (duplicate options, a one-line
 * explanation, a too-short prompt).
 *
 * Shared by two paths with very different review guarantees: the curated
 * admin-review draft flow (a human always looks at this score before
 * publishing) and the AI practice pool (served to a student in real time,
 * with no human in the loop — see MIN_SERVABLE_QUALITY_SCORE).
 */
export function scoreQuestionQuality(generated: QualityScoreInput): number {
  const distinctOptions = new Set(
    generated.options.map((option) => option.trim().toLocaleLowerCase()),
  ).size;
  const hasUsefulExplanation = generated.explanation.trim().length >= 40;
  const hasGroundedPrompt = generated.question_text.trim().length >= 30;
  return Math.min(
    100,
    65 +
      (distinctOptions === 4 ? 15 : 0) +
      (hasUsefulExplanation ? 10 : 0) +
      (hasGroundedPrompt ? 10 : 0),
  );
}

/**
 * The AI practice pool has no reviewer between generation and a student
 * seeing the question, so it needs a stricter floor than the curated draft
 * pipeline (where every item is human-reviewed regardless of score). A
 * question scoring below this is dropped rather than served.
 */
export const MIN_SERVABLE_QUALITY_SCORE = 85;
