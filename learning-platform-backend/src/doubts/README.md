# Doubts Module

The Doubts module stores student-created questions with learning context. A
doubt can be attached to a topic, practice attempt, learning session item, or
notebook card so tutor help does not become an isolated chat thread.

## Endpoints

- `GET /api/doubts` — returns the signed-in student's doubt history.
- `POST /api/doubts` — saves a new doubt and tries to store a tutor response.

## Data strategy

Doubts are persisted in the `doubts` table because they are student-authored
records. The service attempts a guarded tutor response through `AgentService`.
If the LLM is unavailable, the doubt remains `OPEN` instead of failing the save.

## Safety

The browser only sends the student's doubt and optional IDs for context. AI
configuration and prompt policy stay server-side.
