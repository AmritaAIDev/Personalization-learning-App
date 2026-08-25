# Practice session components

`PracticeSession` runs a practice attempt against the authenticated API — no answer key or explanation is ever sent client-side. Equations render through `StudyMarkdown`.

## Answering and autosave

Selecting an option updates the UI immediately; the write drains through a background queue (`src/lib/practice-sync.ts`) that keeps only the newest answer per question and retries with backoff. Navigation, marking, and submission never wait on the network. Per-question timing is recorded from when the question came on screen.

## Attempt flow

Resume reopens at the first unanswered question. The question map shows answered/current/marked states with a jump-to-next-unanswered shortcut. `1`–`4` select an option; arrow keys move between questions. Submitting always goes through a confirmation sheet.

## Review

`PracticeReview` opens on the first question needing attention, filterable to incorrect/correct, with an `ExplainThis` control and (when rated) a `ConfidenceBadge` per question.

## Confidence rating

`ConfidenceSelector` offers an optional pre-answer "How sure are you?" rating, attached to the autosave draft. Skipping it never blocks answering and never affects scoring — only the review's calibration feedback.
