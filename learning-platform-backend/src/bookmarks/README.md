# Bookmarks module

Phase 3 of the jee-compass-inspired feature plan (`docs/JEE-COMPASS-INSPIRATION-PLAN.md`): "save this question for later", surfaced as a toggle on the practice and diagnostic review screens.

Keyed by `(user_id, question_id)` directly against the shared `questions` table — simpler than Notebook's mistake cards, which span three structurally different answer tables (see `notebook/README.md`). Practice, diagnostic and mock-test answers all reference `questions.id` for the same underlying question, so one bookmark row covers a question regardless of which attempt surfaced it; no `source` column is needed. Adaptive (AI-generated) questions are out of scope — `LearningAnswer` references a generated question via a session item, not `questions.id`, so they don't fit this table without a separate path.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/bookmarks` | full bookmarked-question list (with question detail), newest first |
| GET | `/api/bookmarks/ids` | just the bookmarked question ids — lightweight hydration for toggle buttons on a review list |
| POST | `/api/bookmarks/:questionId/toggle` | add or remove the bookmark; returns `{ bookmarked: boolean }` |
