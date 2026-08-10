# Doubts module

Stores student-authored questions with learning context. A doubt can attach to a
topic, practice attempt, learning session item, notebook card, and now a
topic-scoped doubt thread.

## Key components

- `DoubtsController` — `/api/doubts` list, create message, create thread.
- `DoubtsService` — persistence, thread grouping, and out-of-band tutor resolution.
- `DoubtThread` entity — the `doubt_threads` table.
- `Doubt` entity — the `doubts` table, with optional `thread_id`.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/doubts` | signed-in student's doubt threads, message history, summary counts, and recent topics |
| POST | `/api/doubts/threads` | create a new topic-scoped doubt chat |
| POST | `/api/doubts` | save a doubt message in a thread; returns immediately as `OPEN` |

## Thread behavior

Each new chat is persisted in `doubt_threads`. Each message is persisted in
`doubts` with `thread_id`, so the frontend can show multiple chats for the same
topic and send new messages into the selected chat.

Old rows without `thread_id` still appear through legacy grouped threads in the
GET response, so existing demo/history data remains visible.

## Async tutor resolution

`create()` saves the message and fires `resolveDoubtInBackground(doubtId)`
without awaiting the model. The HTTP response returns at once with
`status: OPEN` and `assistantResponse: null`.

The background task calls `AgentService.generateTutorResponse`, then flips the
row to `ANSWERED` with the response. If the model is unavailable, the service
persists a deterministic, question-grounded fallback answer instead of leaving
the learner in a permanent loading/open state. The frontend polls
`GET /api/doubts` until the new message becomes `ANSWERED`.

## RAG citations

When the background task answers a doubt, it also fetches
`AgentService.retrieveSupplementalSources(topic)` and persists reduced citations
on `doubts.sources`. Retrieval is best-effort: a missing or slow vector store
only means no citations, never a failed or delayed save.

## Data strategy and safety

Doubts are student-authored records persisted in the database. The browser sends
only the message, thread/context IDs, and topic scope. AI configuration and
prompt policy stay server-side.
