# Practice module

Secure, database-backed practice session for one published subject/chapter/topic: 15 questions. The mix is 5 Easy / 5 Medium / 5 Hard by default and shifts harder as the student's target month nears (see Target awareness). The server owns the question set, saved answers, scoring, and review release — correct answers and explanations are withheld until the session is submitted. Only published bank content is eligible.

## API

| Method | Path                                                              | Description                                                                                                             |
| ------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/practice/sessions`                                          | start or resume a session for a topic                                                                                   |
| GET    | `/api/practice/sessions/:attemptId`                               | student-safe attempt state                                                                                              |
| PUT    | `/api/practice/sessions/:attemptId/answers/:questionId`           | autosave one answer (lean — no correctness computed here)                                                               |
| POST   | `/api/practice/sessions/:attemptId/submit`                        | grade server-side                                                                                                       |
| GET    | `/api/practice/sessions/:attemptId/review`                        | per-question review with solutions                                                                                      |
| POST   | `/api/practice/sessions/:attemptId/questions/:questionId/explain` | on-demand explanation (throttled 15/min), `depth` optional, degrades to the stored solution if the model is unavailable |

## Notes

- Confidence (1–3, optional) is captured pre-answer and never affects scoring — only the review's calibration verdict (`overconfident` / `underconfident` / `calibrated`).
- Autosave upserts on `(attempt_id, question_id)` and touches no answer relations, so it stays fast on every option tap.

## Target awareness

The difficulty mix follows `getTargetPressure()` (`users/target-pressure.ts`), which reads the student's target month: more than 120 days away (or no target) is 5/5/5, within 120 days is 4/5/6, and within 45 days is 3/5/7. The total stays 15, and a thin tier still degrades gracefully to what the bank has. A session already in progress keeps its question set.
