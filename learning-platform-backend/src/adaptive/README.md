# Adaptive learning module

The formative "Learn" journey — separate from the reviewable 15-question `PracticeModule`. Serves one five-question coordinate (Bloom level × difficulty) at a time, permits one Socratic retry per question, and persists its routing decision after every answer.

## Mastery model

12 coordinates: Recall, Comprehension, Application, Higher-Order × Easy, Medium, Hard. A coordinate clears at ≥80% first-try accuracy (4/5). A first miss opens a Socratic hint (answer withheld); a second miss reveals a structured explanation and demotes one coordinate, routing to a prerequisite topic when one exists.

Question selection excludes anything the learner has already seen for that topic+coordinate. `learning_generation_jobs` is a durable queue — the worker claims jobs with row locking, retries DeepSeek calls up to 3×, and builds a private per-learner question pool grounded in reviewed PostgreSQL material + optional Qdrant context.

## Flashcards

Topic-scoped pool served cache-first (never-seen → due → rest of schedule); generation only runs for the shortfall. Scheduling is FSRS-6 (`fsrs.util.ts`, ported from `ts-fsrs`), storing `difficulty`/`stability` per learner in `flashcard_reviews`.

## Tutor

Hints/explanations are written in the background after an answer (`tutor_conversations`/`tutor_messages`); the conversation endpoint reports `pending: true` until the reply lands. The correct answer is never sent to the model before a second attempt, and a server-side check replaces any reply that leaks it with a safe fallback hint.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/learning/dashboard` | active, completed, historic, and suggested topics |
| GET | `/api/learning/growth` | competency/readiness summary |
| GET | `/api/learning/subtopics` | subtopic breakdown for a topic |
| GET | `/api/learning/coverage` | ready-question audit across all 12 coordinates |
| GET | `/api/learning/placement` | whether a topic needs a placement decision |
| GET | `/api/learning/revision` | short AI-generated topic revision (optional pre-practice step) |
| POST | `/api/learning/sessions` | start or resume a five-question coordinate |
| GET | `/api/learning/sessions/:sessionId` | current student-safe question + round progress/review |
| POST | `/api/learning/sessions/:sessionId/items/:sessionItemId/answer` | grade and route server-side |
| GET/POST | `/api/learning/sessions/:sessionId/tutor` | persisted Socratic chat |
| POST | `/api/learning/sessions/:sessionId/tutor/stream` | streamed chat reply (SSE) |
| GET | `/api/learning/flashcards` | learner's spaced-repetition queue |
| POST | `/api/learning/flashcards/generate` | next recall batch (pool-first) |
| POST | `/api/learning/flashcards/:id/review` | record a recall rating |

## Operations

`npm run migration:run`, then `npm run seed:adaptive` for the reviewed baseline coordinate. Run `npm test` and `npm run build` after changes.
