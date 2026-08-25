# Misconceptions module

Classifies each wrong answer against the question's `common_errors` and keeps a running per-user tally, so the Notebook can surface the *dominant* recurring gap for a topic. No controller — a shared service consumed by whatever saves wrong answers.

- One `common_errors` candidate → used directly, no model call.
- Multiple candidates → `AgentService.classifyMisconception` picks the best match (timeout-bounded).
- Model unavailable → a stable, seeded deterministic pick, so repeated calls for the same wrong answer stay consistent.

`recordFromWrongAnswer` is fire-and-forget and best-effort — every failure is caught and logged, never thrown. Called from `PracticeService.submitAttempt` and `AdaptiveService.submitAnswer`.

Storage: `misconception_hits`, one row per `(user, misconceptionHash)` with a running `hitCount`.

## Reading

- `getDominantForTopic(userId, subject, topic)` — single-topic lookup.
- `getDominantByTopic(userId, scopes)` — batch variant for a page rendering many topic groups at once.
