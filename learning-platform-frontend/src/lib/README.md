# lib

Shared, framework-agnostic helpers for the frontend: the HTTP client, type
mirrors of server payloads, and pure logic that is unit-tested in isolation.

## HTTP & data

- `api.ts` — `apiFetch`, the only HTTP client. Normalises `NEXT_PUBLIC_API_URL`,
  unwraps the `{ data }` envelope, dedupes in-flight GETs, optional in-memory read
  cache (`memoryCacheTtlMs`), and emits `jee-ai:learning-data-updated` after
  learning writes. `ApiError` carries the HTTP status. Unit tested in `api.test.ts`.
- `format.ts` — `formatDuration` / `formatDateTime` display helpers.
- `use-body-scroll-lock.ts` — locks body scroll while a modal/sheet is open
  (submit confirmation, flashcard deck).

## Server payload types

Type mirrors of backend responses — no mock data, just shapes:

- `learning-types.ts` — adaptive sessions, tutor messages, dashboard, tabs.
- `practice-types.ts`, `practice.ts` — reviewed practice scope + helpers
  (`practiceScopeFromSearchParams`, `summarizePracticeProgress`,
  `nextUnansweredIndex`).
- `diagnostic-types.ts` — tests, analysis, per-question review, recommendations.
- `notebook-types.ts` — mistake cards + concept groups.
- `doubts-types.ts` — doubts list/create.
- `growth-types.ts`, `question-review-types.ts`, `student-dashboard-types.ts`.

## Pure session logic (unit tested)

- `flashcard-session.ts` — the deck state machine (queue, buffer, ratings,
  "again" requeue). Tested in `flashcard-session.test.ts`.
- `practice-sync.ts` — the optimistic answer queue: newest-per-question,
  retry-with-backoff, in-flight dedupe. Tested in `practice-sync.test.ts`.
- `tutor-polling.ts` — backoff schedule for waiting on a background tutor reply.
  Tested in `tutor-polling.test.ts`.
- `learning.ts` — scope/tab parsing, `learningUrl`, `describeRoundOutcome`.
  Tested in `learning.test.ts`; `practice.ts` tested in `practice.test.ts`.

## Conventions

- All learner-specific values come from `apiFetch` against the backend; nothing
  is hardcoded as fixture data in components (AGENTS.md §8).
- Pure logic lives here so it can be tested without rendering components.