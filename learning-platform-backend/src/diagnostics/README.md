# Diagnostics module

Secure, database-backed JEE tests (the "Tests" tab). A new attempt selects fifteen
published questions — five Easy, five Medium, five Hard — with varied Bloom levels
and chapter coverage. The selector first avoids questions seen in the learner's
four most recent completed tests, falling back to the reviewed bank only to keep
the test balanced. AI-generated questions never enter a live test directly; they
must be validated and published to the `questions` bank first.

## Key components

- `DiagnosticsController` — `/api/diagnostics`.
- `DiagnosticsService` — attempt lifecycle, question selection, autosave, grading, analysis, review, recommendations, history.
- `DiagnosticAttempt` / `DiagnosticAnswer` / `LearningResource` entities.
- DTOs (`CreateDiagnosticDto`, `SaveDiagnosticAnswerDto`, `ClearDiagnosticHistoryDto`).

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard` | stats, readiness, active attempt, recent history |
| GET | `/history` | submitted test history |
| DELETE | `/history` | clear history (body `{ confirmation: 'DELETE' }`) |
| POST | `/` | start/resume a 30-min, 15-question test (`PROGRAM` or `TOPIC_PLACEMENT`) |
| GET | `/:attemptId` | student-safe attempt — no keys/solutions |
| PATCH | `/:attemptId/answers/:questionId` | autosave one selection |
| POST | `/:attemptId/submit` | grade server-side, persist analysis |
| GET | `/:attemptId/analysis` | score, grade, topic/Bloom performance, weak topics |
| GET | `/:attemptId/review` | per-question review (your answer vs correct, solution, isCorrect) |
| GET | `/:attemptId/recommendations` | curated resources for weak topics |

## Scoring

- **Mark-weighted**: `scorePercent = earned marks ÷ total marks`, so a 5-mark
  question outweighs a 1-mark question. Each question's `marks` column is used.
- **Weak-topic sample-size guard**: a topic is flagged weak only if it had ≥2
  questions in the attempt (an n=1 miss no longer produces a false "weak area").
- Grade bands: ≥80 Excellent, ≥60 Good, ≥40 Average, else Needs work.

## AI recap (analysis)

`analysis.recap` is a deterministic, one-line summary assembled from the
computed topic performance (`buildRecap`) — score, grade, strongest topics, and
what to focus on next. It reads like an AI summary but makes **no model call**,
so it is instant, free, and always present. This is the "fallback-first"
default the AI roadmap asks for; the recap ships on every submitted attempt.

## Guessing / integrity heuristic (admin only)

`analysis.integrity` (`buildIntegritySignal`) flags likely guessing from two
independent, deterministic signals over the answered questions:

- a burst of implausibly fast **and** wrong answers (≤5s, ≥40% of answers), and
- a lopsided reuse of one option position (≥80% of answers — the classic "all C").

It only flags (never penalises) and needs ≥5 answered questions to fire. The
signal is **admin-visible only**: `getAnalysis`/`submitAttempt` take an
`isAdmin` flag and `viewAnalysisFor` redacts the note and resets the flag for a
student's own view. The raw signal is still stored in the analysis JSON.

## Per-question review

`GET /:attemptId/review` returns each question with its internal `id` (used to
target the explain endpoint), the learner's selected option, the correct
option, a boolean `isCorrect`, the worked `solution`, the learner's pre-answer
`confidence` (1–3, nullable), and a `calibration` verdict
(`overconfident` | `underconfident` | `calibrated` | null). The frontend
renders question, options, and solution through `StudyMarkdown` so equations
display. This is the drill-down behind the analysis page's "Show review" toggle.

## On-demand explanation

`POST /:attemptId/questions/:questionId/explain` returns
`{ explanation, grounded, sources }` for a single reviewed question. The attempt
is already submitted, so the answer key is the learner's to see; the tutor
teaches it fully via `AgentService.generateTutorResponse` (`explanatory: true`,
`answerRevealed: true`). Body accepts an optional `depth`
(`concise` | `step-by-step` | `from-scratch`). If the model is unavailable the
endpoint degrades to a deterministic explanation built from the stored solution
(`grounded: false`) so the button never dead-ends. `sources` is the RAG citation
list (reviewed concept notes; `[]` when Qdrant is empty/unavailable).

## Confidence calibration

`SaveDiagnosticAnswerDto` accepts an optional `confidence` (1–3) captured before
answering. It is stored on `diagnostic_answers.confidence` (nullable; migration
`AddAnswerConfidence1785400000000`) and surfaced on review as the `calibration`
verdict above.

## Data integrity

`diagnostic_attempts` freezes the selected `questionIds`; `diagnostic_answers`
is unique per attempt/question and cascades on attempt delete. Expiry is
enforced by the backend `expiresAt` timestamp, so a changed browser timer cannot
extend the test. Answers save against the authenticated attempt, never a
client-supplied user ID.

## Topic placement

A `TOPIC_PLACEMENT` attempt stores the exact subject/chapter/topic and, on
submission, places an untouched topic at Level 1/3/5/7/9. Placement never
overwrites answer-backed topic progress; skipping placement starts a topic at
Level 1 through adaptive learning.