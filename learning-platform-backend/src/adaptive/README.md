# Adaptive learning module

This module implements the student-facing, database-backed JEE learning journey. It is deliberately separate from the secure 15-question `PracticeModule`:

- `PracticeModule` is a reviewable 5 Easy / 5 Medium / 5 Hard assessment with answer keys revealed only after submission.
- `AdaptiveModule` is formative. It serves one five-question coordinate at a time, permits one Socratic retry, and persists its routing decision after each answer.

## Mastery matrix

There are 15 coordinates: Remember through Evaluate at Easy, then the same five Bloom levels at Medium, then at Hard. A coordinate is cleared only after a five-answer correct streak. A first miss resets the streak and opens a Socratic hint without sending the key to the browser. A second miss reveals a structured explanation, then demotes one coordinate; the floor can route to a graph prerequisite when one exists.

## Data and AI lifecycle

`learning_topic_states`, `learning_sessions`, `learning_session_items`, and `learning_answers` persist the route. Every learner response is validated against the server-owned question record.

Question selection excludes questions the learner has already seen for the same topic coordinate. Availability checks also count only unused ready questions, so the engine prepares or generates more material instead of silently repeating old questions when the learner keeps practising.

When a practice round starts or completes, the service also prefetches unused questions for the current route and the next likely route in the background. This keeps continuous practice responsive while preserving five-question checkpoints for level decisions.

`learning_generation_jobs` is a durable database queue. The worker claims jobs with PostgreSQL row locking, retries failed DeepSeek calls up to three times, and builds a private `learning_generated_questions` pool for that learner and coordinate. It uses reviewed PostgreSQL material plus optional Qdrant context as grounding. These questions are not inserted into the public `questions` bank; global publication remains an explicit admin review action.

`flashcards` and `flashcard_reviews` implement database-backed spaced recall. New flashcards can be generated through DeepSeek only from server-assembled reviewed database material, then stored as `AI_GENERATED` published records. `tutor_conversations` and `tutor_messages` preserve the side-assistant thread for a session.

For a first miss, the correct answer and stored solution are never included in the tutor prompt. A server-side response boundary also replaces a model response that repeats the exact stored answer with a database-backed Socratic hint. The full explanation is available only after the allowed second attempt.

## API surface

- `POST /api/learning/sessions` - starts or resumes a five-question coordinate.
- `GET /api/learning/sessions/:sessionId` - returns only the current student-safe question.
- `POST /api/learning/sessions/:sessionId/items/:sessionItemId/answer` - grades and routes server-side.
- `GET|POST /api/learning/sessions/:sessionId/tutor` - persisted Socratic chat.
- `GET /api/learning/dashboard` - active, completed, historic, and suggested topics.
- `GET /api/learning/flashcards` - recall deck.
- `POST /api/learning/flashcards/generate` - generates grounded flashcards and persists them in the database.
- `POST /api/learning/flashcards/:id/review` - SRS rating.

## Operations

Run `npm run migration:run`, then `npm run seed:adaptive` to install the reviewed baseline coordinate and flashcards. Higher coordinates are populated by the DeepSeek worker as real database records, never by frontend sample data. Run `npm test` and `npm run build` after changes.
