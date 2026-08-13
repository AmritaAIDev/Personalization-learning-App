# Adaptive learning module

This module implements the student-facing, database-backed JEE learning journey. It is deliberately separate from the secure 15-question `PracticeModule`:

New topics begin at Level 1 unless the student completes a topic-scoped placement check. The adaptive session service owns this rule; cross-topic performance is not used to silently raise a fresh topic's starting level.

- `PracticeModule` is a reviewable 5 Easy / 5 Medium / 5 Hard assessment with answer keys revealed only after submission.
- `AdaptiveModule` is formative. It serves one five-question coordinate at a time, permits one Socratic retry, and persists its routing decision after each answer.

## Mastery matrix

There are 12 coordinates: Recall, Comprehension, Application, and Higher-Order, each practised at Easy, Medium, and Hard. A coordinate is cleared when a round is resolved with **>=80% first-try accuracy** (4 of 5 answered correctly on the first attempt). This replaces the earlier perfect-streak gate, so a single recovered miss no longer voids the whole round. A first miss resets the streak and opens a Socratic hint without sending the key to the browser. A second miss reveals a structured explanation, then demotes one coordinate; the floor can route to a graph prerequisite when one exists.

## Data and AI lifecycle

`learning_topic_states`, `learning_sessions`, `learning_session_items`, and `learning_answers` persist the route. Every learner response is validated against the server-owned question record.

Question selection excludes questions the learner has already seen for the same topic coordinate. Availability checks also count only unused ready questions, so the engine prepares or generates more material instead of silently repeating old questions when the learner keeps practising.

When a practice round starts or completes, the service also prefetches unused questions for the current route and the next likely route in the background. This keeps continuous practice responsive while preserving five-question checkpoints for level decisions.

`learning_generation_jobs` is a durable database queue. The worker claims jobs with PostgreSQL row locking, retries failed DeepSeek calls up to three times, and builds a private `learning_generated_questions` pool for that learner and coordinate. It uses reviewed PostgreSQL material plus optional Qdrant context as grounding. These questions are not inserted into the public `questions` bank; global publication remains an explicit admin review action.

### Flashcards: cache-first delivery

`flashcards` is a reusable, topic-scoped pool. A recall batch is served from it
first, ordered for spaced repetition (never-seen cards, then cards that are due,
then the rest of the schedule), so a warm topic answers in milliseconds instead
of waiting on a model round trip. Generation runs only for the shortfall, and
every generated card is persisted with a real identifier, which is what lets
`flashcard_reviews` hold a per-learner schedule. After a batch is served the
service tops the pool up in the background, one run per topic at a time, until
it reaches its target depth.

Cards are derived only from published question material, so the pool is shared
safely across learners while each learner's review schedule stays private.

### Flashcards: FSRS-6 scheduling

`fsrs.util.ts` is a faithful, dependency-free port of FSRS-6 (Anki's current
spaced-repetition algorithm) — ported directly from the official `ts-fsrs`
source rather than re-derived, since the exact constants matter. It runs
the published default weight set (no per-user training; this app doesn't
have the review-history volume optimization needs). `flashcard_reviews`
persists the two-parameter memory state (`difficulty` in `[1,10]`,
`stability` in days); `intervalDays` is a rounded, informational projection
of stability for display, never fed back into the algorithm. `dueAt` is
derived from the *unrounded* stability so a fresh AGAIN can legitimately
come due same-day, rather than being floored to a whole day the way Anki's
discrete learning-step scheduler would. This superseded the SM-2 ease-factor
scheduler from `1786800000000-AddFlashcardEaseFactor`
(`1786900200000-AddFlashcardFsrsState` drops that column).

`tutor_conversations` and `tutor_messages` preserve the side-assistant thread for
a session. A hint or explanation is written in the background after an answer;
the session is marked pending so the conversation endpoint can report that a
reply is being written, and the flag clears when the message is saved or the
fallback is used.

For a first miss, the correct answer and stored solution are never included in the tutor prompt. A server-side response boundary also replaces a model response that repeats the exact stored answer with a database-backed Socratic hint. The full explanation is available only after the allowed second attempt.

## API surface

- `POST /api/learning/sessions` - starts or resumes a five-question coordinate.
- `GET /api/learning/sessions/:sessionId` - returns only the current student-safe question.
- `POST /api/learning/sessions/:sessionId/items/:sessionItemId/answer` - grades and routes server-side.
- `GET|POST /api/learning/sessions/:sessionId/tutor` - persisted Socratic chat.
- `GET /api/learning/dashboard` - active, completed, historic, and suggested topics.
- `GET /api/learning/coverage?subject=...&chapter=...&topic=...` - audits ready question coverage across all 12 adaptive coordinates for the requested topic.
- `GET /api/learning/flashcards` - the learner's spaced-repetition queue, optionally scoped to a subject, chapter, or topic.
- `POST /api/learning/flashcards/generate` - delivers the next recall batch: pool first, grounded generation only for the shortfall, persisted for reuse.
- `POST /api/learning/flashcards/:id/review` - records a recall rating and advances that card's schedule.

`GET /api/learning/sessions/:sessionId/tutor` also returns `pending`, which is
true while a background hint or explanation is still being written.

## Operations

Run `npm run migration:run`, then `npm run seed:adaptive` to install the reviewed baseline coordinate. Higher coordinates are populated by reviewed database rows and the DeepSeek worker as real database records, never by frontend sample data.

## Latency budget

Learner-facing generation is bounded on three axes: model output is capped per
batch, supplemental Qdrant grounding is skipped when reviewed material is
already rich and otherwise time-boxed with a short-lived cache, and a partially
valid AI batch is kept rather than discarded, so one malformed item no longer
costs a minute-long job retry.

Use the coverage endpoint before scaling a topic: every coordinate should have at least five ready questions for a no-latency round. Coordinates below that threshold can still be supported by fallback search and generation, but they should be treated as content gaps during production QA.

Run `npm test` and `npm run build` after changes.
