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
- [ ] Improve subject readiness cards.
- [ ] Improve chapter/topic hierarchy preview.
- [ ] Add better skeletons for dashboard loading.
- [ ] Add smoother transitions for search/results/cards.
- [ ] Verify dashboard on mobile/tablet.

---

# Phase 2 — Learn page rebuild

## 2.1 Learn shell

- [ ] Compact selected-topic workspace header.
- [ ] Remove duplicated titles and oversized topic cards.
- [ ] Improve tab hierarchy: Dashboard, Flashcards, Practice Studio.
- [ ] If no topic is selected, show clean “Find a topic” state.
- [ ] Ensure selected topic state is visible and understandable.

## 2.2 Learn dashboard tab

- [ ] Show current level/state from backend.
- [ ] Explain why the current level was chosen.
- [ ] Show next focus and route progress.
- [ ] Show completed/reinforcement/mastered state clearly.
- [ ] Avoid manual level selection.

## 2.3 Flashcards tab

- [ ] Keep flashcards live AI-generated.
- [ ] Do not store flashcards as frontend mock data.
- [ ] Show proper loading state during generation.
- [ ] Show useful empty/error states if AI fails.
- [ ] Make generated card UI compact and premium.

## 2.4 Practice Studio tab

- [ ] Redesign question and tutor panels.
- [ ] Keep question and chatbot visually connected.
- [ ] Make both panels balanced in height and layout.
- [ ] Support continuous practice until the user stops.
- [ ] Avoid question repetition within active route.
- [ ] Show answer feedback without jarring reloads.
- [ ] Improve markdown rendering in tutor messages.
- [ ] Add smoother loading/skeleton states.

---

# Phase 3 — Adaptive learning engine

## 3.1 Question flow

- [ ] Verify database question coverage per topic/level.
- [ ] Ensure questions are tagged with level, Bloom stage, difficulty, topic, and chapter.
- [ ] Confirm five-question learning sets are built correctly.
- [ ] Add fallback when question supply is low.
- [ ] Ensure repeated questions are avoided.

## 3.2 Level-change logic

- [ ] Confirm strong streak advances one level.
- [ ] Confirm weak performance reinforces same level.
- [ ] Confirm second failure demotes when level > 1.
- [ ] Confirm Level 1 failure can route to prerequisite.
- [ ] Confirm final level completion marks topic mastered.
- [ ] Add/verify tests for adaptive transitions.

## 3.3 Learning state persistence

- [ ] Verify user learning state updates after every answer.
- [ ] Verify session items are saved properly.
- [ ] Verify tutor messages are linked to session items.
- [ ] Verify dashboard reflects updated progress.
- [ ] Verify completed topics appear in history.

---

# Phase 4 — Practice, Notebook, Doubts, Tests

## 4.1 Practice page

- [ ] Upgrade standalone Practice landing UI.
- [ ] Add practice modes: Tutor, Timed, Review.
- [ ] Route topic search directly into practice.
- [ ] Keep all practice data backend-driven.

## 4.2 Notebook

- [ ] Create backend notebook module.
- [ ] Save wrong answers as mistake cards.
- [ ] Save misconception explanation.
- [ ] Add “practice similar” action.
- [ ] Add due-review logic.
- [ ] Replace empty state with real backend data.

## 4.3 Doubts

- [ ] Create backend doubts module.
- [ ] Save doubt with topic/question/session context.
- [ ] Link doubt history to student account.
- [ ] Add tutor response storage.
- [ ] Replace empty state with real backend data.

## 4.4 Tests

- [ ] Separate baseline, mock, sectional, and reviewed attempts.
- [ ] Improve test dashboard UI.
- [ ] Improve attempt analysis UI.
- [ ] Connect weak topics from tests into learning route.

---

# Phase 5 — Data, security, and production quality

## 5.1 Database

- [ ] Review current migrations.
- [ ] Add migrations for new modules only when schema changes are needed.
- [ ] Ensure production does not rely on schema synchronize.
- [ ] Seed proper topic/question data through backend scripts/migrations.

## 5.2 API quality

- [ ] Verify frontend/backend env usage.
- [ ] Verify CORS and cookie/session behavior in production.
- [ ] Verify DeepSeek/LLM failure fallback.
- [ ] Add rate limiting where needed.
- [ ] Add validation for new endpoints.

## 5.3 UI quality

- [ ] Check all pages for loading states.
- [ ] Check all pages for empty states.
- [ ] Check all pages for error states.
- [ ] Check mobile responsiveness.
- [ ] Check accessibility labels and keyboard flow.
- [ ] Remove visual inconsistencies and layout jumps.

## 5.4 Testing and docs

- [ ] Add tests for new route helpers/components where practical.
- [ ] Add backend tests for adaptive and new modules.
- [ ] Keep module README files updated.
- [ ] Run lint/test/build before each push.

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

Next recommended slice:

## Slice 002 — Learn page rebuild

Focus:

- Compact Learn topic workspace.
- Redesign Learn tabs.
- Improve Practice Studio UI.
- Make question+tutor interaction feel like the core product experience.
- Keep existing backend adaptive APIs intact while improving frontend flow.
