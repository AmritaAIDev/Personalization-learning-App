# Doubts module

Student-authored questions with learning context. A doubt can attach to a topic, practice attempt, learning session item, notebook card, and a topic-scoped doubt thread.

`create()` saves the message and fires off tutor resolution without awaiting it — the response returns at once as `status: OPEN`. The background task calls `AgentService.generateTutorResponse`, then flips the row to `ANSWERED`. Before calling, `loadThreadHistory` folds the chat's last three answered turns into the prompt as `recentMessages`, so follow-ups like "now give me one question?" are answered in conversation context instead of as fresh standalone doubts. If the model is unavailable it persists a deterministic, question-grounded fallback and sets `answeredWithFallback: true` so the client can badge it differently instead of implying the tutor genuinely responded. The frontend polls `GET /api/doubts` until the message resolves.

`POST /api/doubts/stream` is the Server-Sent Events variant used by the chat UI: it emits `start` (the created doubt), `chunk` events as the tutor generates text, then `done` with the persisted card. It shares the same prompt context, fallback, citation and persistence code as the background resolver (`buildTutorContext` + `finalizeDoubt`), and generation continues server-side even if the client disconnects — so the polling path remains a correct fallback at all times.

Citations: finalization also fetches `AgentService.retrieveSupplementalSources(topic)` and persists reduced citations on `doubts.sources` — best-effort, never blocks the answer.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/doubts` | threads, message history, summary counts, recent topics |
| POST | `/api/doubts/threads` | create a new topic-scoped doubt chat |
| POST | `/api/doubts` | save a doubt message in a thread; returns immediately as `OPEN` |
| POST | `/api/doubts/:id/retry` | re-queue an offline fallback answer (owner-only; genuine answers are refused) |
| POST | `/api/doubts/stream` | SSE: create + stream the tutor answer (`start`/`chunk`/`done`/`error`) |
