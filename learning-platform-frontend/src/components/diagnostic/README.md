# Diagnostic visual components

These components render only analysis payloads returned by `DiagnosticsService`:

- `ScoreRing` shows the submitted percentage.
- `PerformanceBars` shows topic or category rows with the backend-calculated status.
- `BloomRadar` visualizes the Bloom-level percentages.
- `ConfidenceBadge` renders the backend `calibration` verdict for a reviewed
  answer (overconfident / underconfident / well-calibrated). It renders nothing
  when no confidence was captured.

They intentionally contain no answer-key data or client-side scoring logic.

The analysis page (`app/(dashboard)/analysis/[attemptId]`) renders the
deterministic `analysis.recap` line in the hero, the admin-only
`analysis.integrity` guess-pattern note (shown only when
`user.role === "admin"`), and per-question `ExplainThis` + `ConfidenceBadge` in
the review drill-down. The diagnostic runner captures the optional pre-answer
confidence and sends it with the answer PATCH.
