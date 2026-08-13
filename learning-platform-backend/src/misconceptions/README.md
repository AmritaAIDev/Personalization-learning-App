# Misconceptions Module

AI Phase 2.2. Classifies each wrong answer against the question's known
`common_errors` and keeps a running per-user tally, so the Notebook can
surface the *dominant* recurring gap for a topic instead of just the first
`common_errors` string on whichever card happened to load.

This module has no controller of its own — it is a shared service consumed by
the modules that actually save wrong answers.

## Classification

`common_errors` has no structured mapping from a specific wrong option to a
specific error string, so:

- **One candidate** → used directly, no model call.
- **Multiple candidates** → `AgentService.classifyMisconception` (the only
  place this module calls the LLM, per AGENTS.md §4) picks the index that best
  explains the specific wrong choice. Timeout-bounded.
- **Model unavailable/rejected** → a stable (seeded, not random) deterministic
  pick from `questionId:selectedOption`, so repeated calls for the same wrong
  answer are consistent even when the model is down.

## Recording

`recordFromWrongAnswer` is best-effort by contract: every failure (model or
database) is caught and logged, never thrown. It is called fire-and-forget
(`void … .catch()`, matching the existing tutor-hint pattern in
`AdaptiveService.submitAnswer`) from:

- `PracticeService.submitAttempt` — once per submitted attempt, over every
  newly-wrong answer.
- `AdaptiveService.submitAnswer` — on a Socratic first miss and an explained
  second miss.

## Storage

`misconception_hits` (migration `1786900000000-CreateMisconceptionHits`), one
row per `(user, misconceptionHash)` with a running `hitCount`. Hashed because
the misconception text itself can be long; a unique index on the hash keeps
repeat occurrences accumulating on one row instead of duplicating.

## Reading

- `getDominantForTopic(userId, subject, topic)` — single-topic lookup.
- `getDominantByTopic(userId, scopes)` — batch variant for a page rendering
  many topic groups at once (one query, not one per group). Used by the
  Notebook concept view.
