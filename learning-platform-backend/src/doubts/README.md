# Doubts module

Student-authored questions with learning context. A doubt can attach to a topic, practice attempt, learning session item, notebook card, and a topic-scoped doubt thread.

`create()` saves the message and fires off tutor resolution without awaiting it — the response returns at once as `status: OPEN`. The background task calls `AgentService.generateTutorResponse`, then flips the row to `ANSWERED`. If the model is unavailable it persists a deterministic, question-grounded fallback and sets `answeredWithFallback: true` so the client can badge it differently instead of implying the tutor genuinely responded. The frontend polls `GET /api/doubts` until the message resolves.

Citations: the background task also fetches `AgentService.retrieveSupplementalSources(topic)` and persists reduced citations on `doubts.sources` — best-effort, never blocks the answer.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/doubts` | threads, message history, summary counts, recent topics |
| POST | `/api/doubts/threads` | create a new topic-scoped doubt chat |
| POST | `/api/doubts` | save a doubt message in a thread; returns immediately as `OPEN` |
