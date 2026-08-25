# lib

Shared, framework-agnostic helpers: the HTTP client, type mirrors of server payloads, and pure logic that's unit-tested in isolation.

## HTTP & data

- `api.ts` — `apiFetch`, the only HTTP client. Unwraps the `{ data }` envelope, dedupes in-flight GETs, optional in-memory read cache, emits a `learning-data-updated` event after writes. `ApiError` carries the HTTP status.
- `format.ts` — display helpers (`formatDuration`, `formatDateTime`).
- `use-body-scroll-lock.ts` — locks body scroll while a modal/sheet is open.

## Server payload types

Type mirrors of backend responses, no mock data: `learning-types.ts`, `practice-types.ts` / `practice.ts`, `diagnostic-types.ts`, `notebook-types.ts`, `doubts-types.ts`, `growth-types.ts`, `question-review-types.ts`, `student-dashboard-types.ts`.

## Pure session logic (unit tested)

- `flashcard-session.ts` — deck state machine (queue, buffer, ratings, "again" requeue, hesitation tracking).
- `practice-sync.ts` — optimistic answer queue (newest-per-question, retry-with-backoff).
- `tutor-polling.ts` — backoff schedule for a background tutor reply.
- `learning.ts` — scope/tab parsing, `learningUrl`, round-outcome copy, plain-language Bloom-level labels.

## Conventions

All learner-specific values come from `apiFetch`; nothing is hardcoded as fixture data in components. Pure logic lives here so it's testable without rendering components.
