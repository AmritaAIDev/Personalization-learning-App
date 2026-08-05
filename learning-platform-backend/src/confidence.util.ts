/**
 * Confidence calibration shared by practice and diagnostics review.
 *
 * A learner rates confidence (1 = unsure, 3 = certain) before answering. After
 * the answer is graded we can compare intent against outcome:
 *  - `overconfident`  — felt sure (3) but got it wrong.
 *  - `underconfident` — felt unsure (1) but got it right.
 *  - `calibrated`     — confidence matched the outcome.
 *
 * Returns `null` when no confidence was captured so the UI simply omits the
 * badge instead of guessing.
 */
export type ConfidenceCalibration =
  | 'overconfident'
  | 'underconfident'
  | 'calibrated';

export function calibrationFor(
  confidence: number | null | undefined,
  isCorrect: boolean,
): ConfidenceCalibration | null {
  if (confidence == null) return null;
  if (confidence >= 3 && !isCorrect) return 'overconfident';
  if (confidence <= 1 && isCorrect) return 'underconfident';
  return 'calibrated';
}
