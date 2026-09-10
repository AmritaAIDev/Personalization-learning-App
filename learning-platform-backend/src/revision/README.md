# Revision module

Phase 6 (the centerpiece) of the jee-compass-inspired feature plan (`docs/JEE-COMPASS-INSPIRATION-PLAN.md`): one page combining wrong answers, bookmarks, weak topics, recent activity and recommendations — modeled on jee-compass's `Revision.jsx` tab structure.

Built entirely on existing services rather than re-querying their underlying tables:

- **Wrong answers** reuse `NotebookService.getMistakes()` (`../notebook`) as-is — practice + adaptive + diagnostic, deduped to the latest attempt per question, with its existing `DUE`/`UPCOMING` review state standing in for "unresolved/resolved". Mock-test wrong answers are out of scope for the same reason Notebook itself excludes them: `MockTestAnswer` has no single subject and isn't part of that dedup model.
- **Bookmarks** reuse `BookmarksService.getBookmarks()` (`../bookmarks`) as-is.
- **Weak / recently-practiced topics** reuse `CompetencyService.getGrowth()` (`../adaptive`) — the same per-topic score+band the dashboard's subject coverage already shows — cross-referenced with `LearningTopicState.lastActivityAt` for recency. This is "latest known state per topic", not a re-derivation of any single diagnostic attempt's `weakTopics`.
- **Recommendations** mirror `diagnostics.service.ts`'s `getRecommendations()` resource-matching query shape exactly, generalised from one attempt's subject to the student's current cross-subject weak-topic set.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/revision/hub` | the full revision hub payload for the signed-in student |
