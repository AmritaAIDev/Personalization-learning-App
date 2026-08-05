# Practice Module

This module runs a secure, database-backed practice session for one published
subject/chapter/topic scope.

- A session always contains 15 questions: five Easy, five Medium, and five Hard.
- The server owns the question set, saved answers, scoring, and review release.
- Correct answers and explanations are withheld until a submitted session is
  retrieved through the review endpoint.
- Only published bank content is eligible for student practice.

The catalog endpoint in QuestionsModule exposes the readiness counts that the
frontend uses before offering a practice session.

## Autosave path

`PUT /sessions/:attemptId/answers/:questionId` runs on every option tap, so it
is deliberately lean: one narrow attempt lookup, one option-validity check, and
one conflict-safe upsert on `(attempt_id, question_id)`. No answer relations are
loaded and no correctness is ever computed on this path — `isCorrect` is reset
to null and only filled in at submission.

Session creation loads only the columns the difficulty/Bloom balancer reads;
full question rows are fetched once, for the fifteen selected questions, when
the payload is built. The attempt payload also reports the real difficulty mix
so the client never has to assume one.

## Confidence calibration

`SavePracticeAnswerDto` accepts an optional `confidence` (1–3) rated before
answering. It is stored on `practice_answers.confidence` (nullable; migration
`AddAnswerConfidence1785400000000`) and never affects scoring. On review each
result carries the `confidence` and a `calibration` verdict
(`overconfident` when sure-but-wrong, `underconfident` when unsure-but-right,
else `calibrated`; null when unrated) via the shared `calibrationFor` helper.

## On-demand explanation

`POST /sessions/:attemptId/questions/:questionId/explain` returns
`{ explanation, grounded, sources }` for one reviewed question (`questionId` is
the internal UUID exposed on the review payload as `id`). The session must be
submitted. It calls `AgentService.generateTutorResponse` with the answer
revealed and an optional `depth` (`concise` | `step-by-step` | `from-scratch`),
and degrades to the stored solution (`grounded: false`) when the model is
unavailable. `sources` is the RAG citation list (reviewed concept notes;
`[]` when Qdrant has nothing or is unavailable). Throttled to 15/min per user.
