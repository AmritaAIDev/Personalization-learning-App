# Practice session components

`PracticeSession` runs a learner practice attempt against the authenticated API.
It receives no answer key or explanation. Question stems and answer options render through the shared StudyMarkdown (KaTeX), so equations display. The header is compact (title + countdown + slim progress). The server owns selection validation,
scoring, the final result, and review data. `PracticeReview` is intentionally
separate so explanations are requested only after a submitted attempt.

## Answering and autosave

Selecting an option updates the UI immediately; the write is drained by the
background queue in `src/lib/practice-sync.ts`. That queue keeps only the newest
answer per question — changing a choice while an older save is still in flight
replaces it rather than queueing a second write — and retries a failed save with
backoff instead of dropping it. Navigation, marking, and submission never wait
on the network, and the save state is always visible ("saving", "saved", or a
retry prompt). Leaving with unsaved answers triggers a browser warning.

Timing is recorded per question, measured from when that question came on
screen, so the stored answer time is meaningful for analytics.

## Attempt flow

- Resuming an attempt reopens it at the first unanswered question.
- The question map shows answered, current, and marked-for-review states, with a
  jump-to-next-unanswered shortcut.
- `1`–`4` select an option; the arrow keys move between questions.
- Submitting always goes through a confirmation sheet that reports answered,
  unanswered, and marked counts, links directly to any unanswered question, and
  warns when an autosave is still in flight. The set composition shown in the
  header comes from the attempt payload, not a hardcoded assumption.

## Review

`PracticeReview` opens on the first question that needs attention, can be
filtered to incorrect or correct answers, and renders solutions through the
shared `StudyMarkdown` renderer so formulas display properly. It offers both
"practice again" and a route into the tutor-led workspace for the same topic.

Each reviewed question also shows an `ExplainThis` control (on-demand AI
explanation with a depth toggle) and, when the learner rated their confidence, a
`ConfidenceBadge` (over/under-confident/well-calibrated). Both are backend-driven.

## Confidence rating

During a session, `ConfidenceSelector` offers an optional "How sure are you?"
(Unsure / Maybe / Confident) rating above the options. It is captured before
answering and attached to the autosave draft (`src/lib/practice-sync.ts`), so
the confidence lands on the same answer row. Skipping it never blocks answering,
and it never affects scoring — only the review's calibration feedback.
