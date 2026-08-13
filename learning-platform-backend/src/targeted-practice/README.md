# Targeted Practice Module

Shared on-demand single-question generation primitive, deliberately outside
the adaptive session/state-machine tables — a targeted question is generated,
answered once, and never advances a learning level or topic state. Reused by
two AI Phase 2 features that are really the same mechanic with a different
prompt focus:

- **2.2 "Practice this misconception"** — `reason: 'MISCONCEPTION'`,
  `focusText` is the Notebook's dominant classified misconception for a topic
  (see `../misconceptions/README.md`).
- **2.3 "Try a similar one"** — `reason: 'SIMILAR'`, `focusText` is a source
  question's text; the model is asked to stay isomorphic without repeating it
  verbatim.

## Endpoints

- `POST /api/targeted-practice/questions` — `{ subject, chapter, topic,
  reason, focusText, sourceQuestionId?, bloomLevel?, difficulty? }` → a
  question payload with no answer key (`options`, `hint`, `conceptTags`, …).
- `POST /api/targeted-practice/questions/:id/answer` — `{ selectedOption }` →
  `{ isCorrect, correctAnswer, solution }`. A question can only be answered
  once (`ConflictException` on a second attempt).

## Generation

Grounded the same way the adaptive pool worker grounds its batches —
`AdaptiveContentService.buildSourceMaterial` (made public for this reuse) —
via `AgentService.generateLearningQuestionBatch` with `count: 1` and a
`focusHint` appended to the prompt. Generations are gated by the same
`scoreQuestionQuality` / `MIN_SERVABLE_QUALITY_SCORE` floor as the AI pool: a
low-effort generation is rejected (`ServiceUnavailableException`) rather than
served.

## Caching

A repeated request for the same `(user, subject, topic, reason, focusText)`
within a 10-minute window reuses the existing unanswered row instead of
generating (and paying for) another one — handles double-clicks and bounds
cost, per AGENTS.md's cost/latency guard.

## Storage

`targeted_practice_questions` (migration
`1786900100000-CreateTargetedPracticeQuestions`).
