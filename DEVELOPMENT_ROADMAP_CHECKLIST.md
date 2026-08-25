# JEE AI Development Roadmap Checklist

This is the living development checklist for the platform rebuild. Update this file after every completed development slice.

## Current direction

The product direction is now defined in:

- `PRODUCT_PRD_ARCHITECTURE.md`
- `LEARNING_EXPERIENCE_SPEC.md`
- `system_specifications.md`

The build should proceed step by step. Each slice must keep the platform professional, modular, database-backed, and production-oriented.

## Development rules

- Do not add fake student data in the frontend.
- UI can show honest empty/loading/error states before backend data exists.
- Search remains the main entry point.
- Learn and Practice are the core learning surfaces.
- Level choice is automatic, never manually selected by the student.
- Backend owns adaptive decisions.
- Every major module should have documentation.
- Validate each slice with lint/test/build where relevant.

---

# Phase 1 — Product shell and dashboard

## 1.1 PRD and architecture

- [x] Research top JEE personalized-learning platforms.
- [x] Define product direction.
- [x] Create PRD and information architecture.
- [x] Define page map and navigation model.

## 1.2 Navigation and product shell

- [x] Restructure sidebar navigation.
- [x] Add Practice page shell.
- [x] Add Tests page shell.
- [x] Add Notebook page shell.
- [x] Add Doubts page shell.
- [x] Add reusable product UI primitives.
- [x] Keep new shell pages free from fake user data.

## 1.3 Dashboard command center

- [x] Make Dashboard search-first.
- [x] Keep baseline diagnostic conditional for new users.
- [x] Add backend-driven next-action panel.
- [x] Add weak-topic area without frontend mock rows.
- [x] Improve subject readiness cards.
- [x] Improve chapter/topic hierarchy preview.
- [x] Add better skeletons for dashboard loading.
- [x] Add smoother transitions for search/results/cards.
- [x] Verify dashboard on mobile/tablet.

---

# Phase 2 — Learn page rebuild

## 2.1 Learn shell

- [x] Compact selected-topic workspace header.
- [x] Remove duplicated titles and oversized topic cards.
- [x] Improve tab hierarchy: Dashboard, Flashcards, Practice Studio.
- [x] If no topic is selected, show clean “Find a topic” state.
- [x] Ensure selected topic state is visible and understandable.

## 2.2 Learn dashboard tab

- [x] Show current level/state from backend.
- [x] Explain why the current level was chosen.
- [x] Show next focus and route progress.
- [x] Show completed/reinforcement/mastered state clearly.
- [x] Avoid manual level selection.

## 2.3 Flashcards tab

- [x] Keep flashcards live AI-generated.
- [x] Do not store flashcards as frontend mock data.
- [x] Show proper loading state during generation.
- [x] Show useful empty/error states if AI fails.
- [x] Make generated card UI compact and premium.

## 2.4 Practice Studio tab

- [x] Redesign question and tutor panels.
- [x] Keep question and chatbot visually connected.
- [x] Make both panels balanced in height and layout.
- [x] Support continuous practice until the user stops.
- [x] Avoid question repetition within active route.
- [x] Show answer feedback without jarring reloads.
- [x] Improve markdown rendering in tutor messages.
- [x] Add smoother loading/skeleton states.

---

# Phase 3 — Adaptive learning engine

## 3.1 Question flow

- [x] Add backend question coverage audit by topic/level.
- [x] Ensure questions are tagged with level, Bloom stage, difficulty, topic, and chapter.
- [x] Confirm five-question learning sets are built correctly.
- [x] Add fallback when question supply is low.
- [x] Ensure repeated questions are avoided.

## 3.2 Level-change logic

- [x] Confirm strong streak advances one level.
- [x] Confirm weak performance reinforces same level.
- [x] Confirm second failure demotes when level > 1.
- [x] Confirm Level 1 failure can route to prerequisite.
- [x] Confirm final level completion marks topic mastered.
- [x] Add/verify tests for adaptive transitions.

## 3.3 Learning state persistence

- [x] Verify user learning state updates after every answer with row-level mutation test.
- [x] Verify session item progress is projected safely.
- [x] Verify tutor messages are linked to session items.
- [x] Verify dashboard reflects updated progress.
- [x] Verify completed topics appear in history.

---

# Phase 4 — Practice, Notebook, Doubts, Tests

## 4.1 Practice page

- [x] Upgrade standalone Practice landing UI.
- [x] Add practice modes: Tutor, Timed, Review.
- [x] Route topic search directly into practice.
- [x] Keep all practice data backend-driven.

## 4.2 Notebook

- [x] Create backend notebook module.
- [x] Save wrong answers as mistake cards.
- [x] Save misconception explanation.
- [x] Add “practice similar” action.
- [x] Add due-review logic.
- [x] Replace empty state with real backend data.

## 4.3 Doubts

- [x] Create backend doubts module.
- [x] Save doubt with topic/question/session context.
- [x] Link doubt history to student account.
- [x] Add tutor response storage.
- [x] Replace empty state with real backend data.

## 4.4 Tests

- [x] Separate baseline, mock, sectional, and reviewed attempts.
- [x] Improve test dashboard UI.
- [x] Improve attempt analysis UI.
- [x] Connect weak topics from tests into learning route.

---

# Phase 5 — Data, security, and production quality

## 5.1 Database

- [x] Review current migrations.
- [x] Add migrations for new modules only when schema changes are needed.
- [x] Ensure production does not rely on schema synchronize.
- [x] Seed proper topic/question data through backend scripts/migrations.

## 5.2 API quality

- [x] Verify frontend/backend env usage.
- [x] Verify CORS and cookie/session behavior in production.
- [x] Verify DeepSeek/LLM failure fallback.
- [x] Add rate limiting where needed.
- [x] Add validation for new endpoints.

## 5.3 UI quality

- [x] Check all pages for loading states.
- [x] Check all pages for empty states.
- [x] Check all pages for error states.
- [x] Check mobile responsiveness.
- [x] Check accessibility labels and keyboard flow.
- [x] Remove visual inconsistencies and layout jumps.

## 5.4 Testing and docs

- [x] Add tests for new route helpers/components where practical.
- [x] Add backend tests for adaptive and new modules.
- [x] Keep module README files updated.
- [x] Run lint/test/build before each push.

---

# Current completed slice

## Slice 001 — Product shell foundation

Completed:

- PRD/architecture created.
- Sidebar navigation restructured.
- Dashboard command center first pass implemented.
- Practice, Tests, Notebook, Doubts shells added.
- Product UI primitives added.
- Practice search routing added.
- No fake student history shown in new shell pages.
- Frontend lint/test/build passed.

## Slice 002 — Phase 1 dashboard completion

Completed:

- Dashboard subject readiness cards now use real learning growth data.
- Dashboard chapter/topic preview now uses tracked topic evidence.
- Dashboard top stat cards and readiness map have stronger skeleton loading.
- Dashboard cards now have smoother hover and entrance transitions.
- Phase 1 dashboard checklist is complete.

Next recommended slice:

## Slice 003 — Learn page rebuild

Focus:

- Compact Learn topic workspace.
- Redesign Learn tabs.
- Improve Practice Studio UI.
- Make question+tutor interaction feel like the core product experience.
- Keep existing backend adaptive APIs intact while improving frontend flow.

Completed:

- Learn no-topic state now includes a direct topic search workspace.
- Selected-topic header is more compact and clearly shows topic/chapter/state.
- Learn tabs now communicate Dashboard, Flashcards, and Practice Studio roles.
- Flashcard copy and card layout are cleaner while keeping live AI generation behavior.
- Practice Studio has balanced question and linked tutor panels with continuous-practice copy.
- Answer option selected state now uses the product learning color instead of the old red style.

## Slice 004 — Learn functional depth

Completed:

- Learn dashboard now shows current level, coordinate, Bloom target, difficulty, status, and decision source from backend state.
- Learn dashboard now explains automatic level decisions without exposing manual level controls.
- Practice Studio now shows a dedicated preparation skeleton while backend sessions are being created.
- Targeted backend adaptive tests passed for placement and mastery routing.
- Question non-repetition remains in Phase 3 because it requires backend question-selection guarantees.

## Slice 005 — Backend adaptive engine hardening

Completed:

- Confirmed question selection excludes previously seen questions for the same learner/topic coordinate.
- Fixed readiness counting so availability checks use the same Bloom aliases as selection.
- Added backend coverage audit endpoint for topic-level readiness across all 12 coordinates.
- Added/extended adaptive tests for content coverage, non-repetition, final Level 12 mastery, and legacy level safety.
- Updated adaptive module docs with the coverage endpoint and production QA rule.

Still open:

- Full database seed audit must be run against the target production database.
- Low-supply fallback/generation should be tested with an integration database.
- Full persistence verification needs integration tests across session item, answer, tutor, state, dashboard, and history rows.

## Slice 006 — Adaptive persistence projection verification

Completed:

- Added tests proving active/mastered topic states are projected into the learning dashboard.
- Added tests proving completed learning sessions appear in dashboard history with coordinate metadata.
- Added tests proving session item progress exposes current/pending state and retry count.
- Added tests proving current questions do not leak stored solution text through the session payload.
- Tutor message linkage was already covered through second-attempt explanation routing.

Still open:

- Row-level answer/state mutation verification needs an integration database test around `applyAnswer`.

## Slice 007 — Practice page upgrade

Completed:

- Rebuilt standalone Practice landing as a reviewed-practice command page.
- Clarified the difference between reviewed practice, adaptive tutor mode, and future review mode.
- Kept topic search routed directly into `/practice` with catalog-backed readiness counts.
- Polished active Practice session loading skeleton, header, answer-save copy, and question map UI.
- Kept all practice attempt data backend-driven; no frontend mock attempts or fake history were added.

## Slice 008 - Notebook repair layer

Completed:

- Added a backend Notebook module with `GET /api/notebook/mistakes`.
- Derived mistake cards from saved submitted Practice answers and Adaptive learning answers.
- Included selected answer, correct answer, solution, misconception, concept tags, Bloom/difficulty, and topic scope.
- Added a real Notebook UI with loading, error, empty, card list, weak-topic summary, and Practice Similar action.
- Added backend unit tests for notebook card mapping, submitted-practice filtering, and latest-card deduplication.

Still open:

- Due-review scheduling needs a dedicated persistence model when spaced repair intervals are finalized.

## Slice 009 - Doubt hub persistence

Completed:

- Added a backend Doubts module with `GET /api/doubts` and `POST /api/doubts`.
- Added a `doubts` table migration for student-owned doubt history and context IDs.
- Saved doubts with subject, chapter, topic, question/session/practice/notebook context, status, and tutor response.
- Kept doubt save resilient: if the tutor service is unavailable, the doubt remains saved as `OPEN`.
- Rebuilt the Doubts UI with a real composer, loading/error/success states, saved-history cards, and open/answered summary.
- Added backend tests for successful tutor response storage, LLM fallback, and history summary.

## Slice 010 - Tests command center

Completed:

- Rebuilt the Tests page as a backend-driven command center using the existing diagnostic dashboard API.
- Added baseline diagnostic launch/resume, reviewed practice routing, and future mock-test placeholder without fake records.
- Surfaced real tests taken, best score, average score, active attempt state, recent analysis cards, and weak-topic repair queue.
- Connected post-test actions to Notebook and Practice so scores lead back into repair workflows.

Still open:

- Full-length mock/sectional attempts still need a dedicated backend schema before they can be fully real modes.

## Slice 011 - Remaining product-quality closure

Completed:

- Rebuilt the diagnostic Analysis page with a premium score hero, backend-derived score summary, topic performance, Bloom profile, repair priority cards, and direct actions into Learn, Practice, Notebook, and Recommendations.
- Added rate limiting to the new Notebook and Doubts API controllers.
- Verified frontend API base URL is environment-driven and backend CORS/session behavior is configured through the bootstrap layer.
- Verified TypeORM production safety uses `synchronize: false`.
- Verified new student-created Doubts schema uses a migration while Notebook remains a safe database-derived read model.
- Updated the roadmap checklist for completed Phase 4 and Phase 5 quality items.
- Ran frontend lint/test/build and backend lint/test/build checks.

Still open:

- Full-length mock/sectional attempts require a dedicated backend schema before they can be real modes.
- Notebook due-review is implemented as a backend-derived schedule; a dedicated persistence model is only needed later for custom spaced-repetition ratings.
- Row-level adaptive state mutation is covered by a repository-backed mutation spec around `applyAnswer`; a live database integration test can be added later when a dedicated test database is available.
- Production seed and low-supply fallback audits must be run against the target database/environment.

## Slice 012 - Continuous integration and real-database verification

Completed:

- Added `.github/workflows/ci.yml` with three gates on every push and pull request:
  backend (lint/test/build), frontend (lint/test/build), and integration.
- The integration job starts a PostgreSQL 16 service container, runs all migrations
  from an empty database, checks schema drift, and runs the integration suite.
- Added `test/integration/` — the first suite that exercises the real HTTP stack
  against a real database: health probe, applied-migration check, 401 on
  unauthenticated reads, 403 on a foreign browser origin, HttpOnly session cookie
  issue/invalidate, no password hash or solution text leaked to the client, and
  row-level verification that an answer writes `learning_answers` and advances
  `learning_topic_states`.
- Added `npm run check:schema-drift`, which fails only on structural entity/migration
  differences and ignores TypeORM's constraint/index naming noise.
- Added `npm run lint:check` so CI lints without rewriting files the way `lint --fix` does.
- Fixed real drift the new gate found: `notebook_concept_summaries.created_at` and
  `updated_at` are `timestamptz` in the migration, but the entity decorators defaulted
  to a naive `timestamp`. Pinned the entity type; no DDL or data change needed.

Closes previously open items:

- Row-level `applyAnswer` mutation is now verified against a live database.
- Full persistence verification now runs across session item, answer, state, and
  dashboard rows in one flow.
- Migrations are proven to build the schema from nothing on every push.

Still open:

- Production seed and low-supply fallback audits must still be run against the
  target production database.
