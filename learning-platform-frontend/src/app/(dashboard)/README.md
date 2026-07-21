# Authenticated student workspace

`(dashboard)` is protected by `DashboardAccess`, while the NestJS API remains the source of authorization.

## Core routes

- `/`: live diagnostic status, adaptive topic suggestions, active routes, and completed-topic highlights.
- `/learn`: five-question Bloom × difficulty adaptive journey with a contextual tutor and database flashcards.
- `/diagnostic`: server-backed start or resume entry point.
- `/diagnostic/[attemptId]`: timed, auto-saving question flow with no answer-key payload.
- `/analysis/[attemptId]`: submitted topic and Bloom analysis.
- `/recommendations/[attemptId]`: resources selected from the database using weak topics.
- `/profile`: authenticated profile, completed diagnostic attempts, and saved adaptive-topic history.

`/arena` and `/analytics` redirect to secure, maintained flows so the prior client-side answer reveal is not reachable.
