# Doubts module

Stores student-authored questions with learning context (a doubt can attach to a
topic, practice attempt, learning session item, or notebook card) and resolves
them with the AI tutor.

## Key components

- `DoubtsController` — `/api/doubts` (list, create).
- `DoubtsService` — persistence + out-of-band tutor resolution.
- `Doubt` entity — the `doubts` table.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/doubts` | the signed-in student's doubt history + open/answered summary + recent topics |
| POST | `/api/doubts` | save a doubt; **returns immediately as `OPEN`** |

### Async resolution (non-blocking)

`create()` saves the doubt and fires `resolveDoubtInBackground(doubtId)` without
awaiting — the HTTP response returns at once with `status: OPEN, assistantResponse: null`.
The background task calls `AgentService.generateTutorResponse`, then flips the row
to `ANSWERED` with the response. If the model is unavailable the doubt stays
`OPEN` (no save failure). The frontend polls `GET /api/doubts` until the new
doubt's status becomes `ANSWERED` (≈3s cadence, ~2 min cap).

This matches the in-session tutor's `pending` pattern: the request never blocks
on the model, so a slow DeepSeek call cannot hang the doubt form.

## RAG citations

When the background task answers a doubt it also fetches
`AgentService.retrieveSupplementalSources(topic)` and persists the reduced
citation list on `doubts.sources` (jsonb, nullable; migration
`AddDoubtSources1785500000000`). Each `DoubtCard` returns `sources: Citation[]`
(empty when Qdrant had nothing or was unavailable), which the doubts page renders
as a "Sources" strip under the answer. Retrieval is best-effort — a missing or
slow vector store just yields no citations, never a failed or delayed answer.

## Data strategy & safety

Doubts are student-authored records persisted in the `doubts` table. The browser
only sends the doubt text and optional context IDs; AI config and prompt policy
stay server-side. The tutor prompt for a doubt carries no answer key and uses
Socratic mode unless an upstream caller explicitly reveals the answer.