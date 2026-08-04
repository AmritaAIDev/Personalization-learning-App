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

## Per-question review

`GET /:attemptId/review` returns each question with the learner's selected
option, the correct option, a boolean `isCorrect`, and the worked `solution`.
The frontend renders question, options, and solution through `StudyMarkdown` so
equations display. This is the drill-down behind the analysis page's "Show
review" toggle.

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