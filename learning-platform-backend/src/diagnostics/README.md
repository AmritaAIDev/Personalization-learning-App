# Diagnostics module

Secure, database-backed JEE tests (the "Tests" tab). An attempt selects 15 published questions — 5 Easy / 5 Medium / 5 Hard, varied Bloom levels and chapters — preferring questions unseen in the learner's last four completed tests. AI-generated questions never enter a live test until published to the `questions` bank.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard` | stats, readiness, active attempt, recent history |
| GET | `/history` | submitted test history |
| DELETE | `/history` | clear history (body `{ confirmation: 'DELETE' }`) |
| POST | `/` | start/resume a 30-min, 15-question test |
| GET | `/:attemptId` | student-safe attempt — no keys/solutions |
| PATCH | `/:attemptId/answers/:questionId` | autosave one selection |
| POST | `/:attemptId/submit` | grade server-side, persist analysis |
| GET | `/:attemptId/analysis` | score, grade, topic/Bloom performance, weak topics |
| GET | `/:attemptId/review` | per-question review (your answer vs correct, solution) |
| GET | `/:attemptId/recommendations` | curated resources for weak topics |
| POST | `/:attemptId/questions/:questionId/explain` | on-demand explanation, degrades to the stored solution if the model is unavailable |

## Scoring

Mark-weighted (`earned ÷ total marks`). A topic is flagged "weak" only with ≥2 questions in the attempt. Grade bands: ≥80 Excellent, ≥60 Good, ≥40 Average, else Needs work.

`analysis.recap` is a deterministic one-line summary (no model call — always present, instant). `analysis.integrity` is an admin-only guessing heuristic (fast-and-wrong bursts, lopsided option reuse); redacted on the student's own view.

## Notes

- Confidence (1–3, optional) is captured pre-answer and surfaced on review as a calibration verdict.
- A `TOPIC_PLACEMENT` attempt places an untouched topic at Level 1/3/5/7/9 on submission; skipping placement starts a topic at Level 1 through adaptive learning.
- `diagnostic_attempts` freezes the selected question set; expiry is enforced server-side.
