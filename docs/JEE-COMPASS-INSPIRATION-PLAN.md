# Bring jee-compass-inspired features into the Learning Platform

## Context

`github.com/PV-Coder/jee-compass` (cloned locally to inspect: `frontend/` is a Vite/React CBSE-prep app) has a well-arranged frontend — dashboards, gamification, a bloom-taxonomy breakdown, a revision hub. This plan captures which of its UI/UX patterns and feature ideas are worth bringing into our app (Next.js frontend + NestJS backend), and which are not. The goal is inspiration, not migration: jee-compass's own code quality is "good but not great" (plain CSS, `localStorage`-only client-side "backend", no persistence, no tests) — our stack is materially more advanced (FSRS flashcards, a placement engine, mastery-routing, a real Postgres-backed backend) and must stay that way.

The repo was cloned to a scratch directory and read end-to-end (`Dashboard.jsx`, `BloomSection.jsx`, `Recommendation.jsx`, `Revision.jsx`, `Analytics.jsx`, `DiagnosticResult.jsx`, `curriculum.js`), then cross-checked file-by-file against our own repo to find out which of its patterns we genuinely lack versus already have (in some cases in a stronger form). That comparison — not a blind feature list — is what this plan is built on.

## What we already have (do not rebuild)

- **XP + streak + leveling** — `StudentActionCenter.tsx` (`xpIntoLevel`, `250 XP/level`, streak tile) and `GrowthPanel.tsx`, backed by real student data. jee-compass's XP/streak is a flat `localStorage` counter — ours is already ahead.
- **Bloom's-taxonomy visualization** — `components/diagnostic/BloomRadar.tsx` + `ScoreRing.tsx`, used on `analysis/[attemptId]/page.tsx`. jee-compass's radar (`Analytics.jsx`) is a hand-rolled SVG polygon; functionally the same idea, ours is production-grade already.
- **Resource-typed recommendations** — `recommendations/[attemptId]/page.tsx` already renders Video/Notes/Practice/Formula resource cards per weak topic (`ResourceCard`, `resourceVisuals`), sourced from `learning-resource.entity.ts` in the backend. This matches jee-compass's `Recommendation.jsx` pattern already — just scoped to one diagnostic attempt rather than being a living, cross-session view (see Phase 3).
- **Real adaptive engine** — FSRS flashcards (`adaptive/fsrs.util.ts`), `placement-engine.ts`, `mastery-routing.ts`, `competency.service.ts`. jee-compass has nothing comparable (no backend at all). None of this should be touched or replaced.

## Genuine gaps (verified, worth closing)

1. **No achievements/badges system anywhere** — backend or frontend. jee-compass's `BADGES` array (`curriculum.js`) is condition-based (streaks, subject counts, XP thresholds) — a good pattern, but it must be computed server-side from real data, not `localStorage`.
2. **No "bookmark this question for later" feature.** Confirmed via grep — the only `bookmark` hits in the frontend are an unrelated lucide icon (`BookMarked`) used for a status indicator, not a real feature.
3. **No unified, persistent revision hub.** Wrong-answer data is currently siloed across four separate entities (`diagnostics/diagnostic-answer.entity.ts`, `practice/practice-answer.entity.ts`, `mock-tests/mock-test-answer.entity.ts`, `adaptive/learning-answer.entity.ts`) with no cross-cutting view. jee-compass's `Revision.jsx` is a single tabbed hub (Queue / Wrong / Bookmarks / Weak Chapters / Recent / Recommendations) with a live summary strip — genuinely useful, and we have nothing like it.
4. **No glanceable multi-subject card grid.** We have `SubjectCoverageExplorer` inside `StudentActionCenter.tsx`, but it's a single-subject-at-a-time tab-filtered panel. jee-compass's `Dashboard.jsx` shows all subjects simultaneously as branded cards (icon, gradient, "X/Y chapters done", quick links) — a complementary, not redundant, pattern.
5. **No mastery-ladder widget.** jee-compass's `Analytics.jsx` (`BloomMasteryCard`) shows a 5-rung ladder (Beginner → Developing → Proficient → Advanced → Master) highlighting the current rung. We show percentages and a radar but not this at-a-glance metaphor.
6. **No subject-identity design token.** Subject → color/icon logic is duplicated ad hoc (`JourneyMap.tsx` does `normalized.includes("math")`, similar scattered checks elsewhere) rather than defined once. jee-compass centralizes this in `SUBJECTS` (`curriculum.js`) and reuses it everywhere.

## Implementation plan

Phases run in this order — each one is buildable and shippable on its own, and later phases lean on components or tokens the earlier ones create. Phase 6 (the Revision Hub) is the most valuable piece but also the most complex, so it's deliberately last: by then the badge engine, bookmarks, subject theme, and mastery components it draws on already exist.

### Phase 1 — Shared subject theme
**Effort: XS · frontend only**

Add `learning-platform-frontend/src/lib/subject-theme.ts`: a small `SUBJECTS` map (id, name, icon, color, gradient) for Physics/Chemistry/Mathematics, modeled on jee-compass's `curriculum.js` `SUBJECTS` object but without the chapter/topic data (that already lives in our backend `topics` module). Every phase below imports from here instead of re-deriving subject branding — this is why it goes first.

### Phase 2 — Achievements / badges
**Effort: M · backend + frontend**

**Backend** (`learning-platform-backend/src/achievements/`, new module):
- `achievement-definition.ts` — a static config list mirroring jee-compass's `BADGES` shape (`id`, `icon`, `name`, `desc`, condition), but conditions read from real aggregates: total tests (across practice/mock-test/diagnostic attempts), current streak (already computed — check `dashboard.service.ts` for the existing streak source), best/avg score, per-subject attempt counts, total XP (already on the student record used by `StudentActionCenter`).
- `student-achievement.entity.ts` — `(studentId, achievementKey, earnedAt)`, persisted so "earned" is permanent even if stats later dip.
- `achievements.service.ts` — evaluates conditions and persists newly-earned badges; called after attempt completion (hook wherever `dashboard.service.ts` / practice / mock-test / diagnostics services already finalize an attempt — reuse that completion path rather than polling).
- `achievements.controller.ts` — `GET /api/achievements` → `{ earned: [...], locked: [...] }`.

**Frontend**: `components/dashboard/AchievementsPanel.tsx` on the main dashboard (`app/(dashboard)/page.tsx`), earned badges highlighted, a few locked ones shown greyed out with their condition as a tooltip — same visual idea as jee-compass's `badges-grid`/`badge-item--locked`, rebuilt in our Tailwind design tokens (`bg-surface`, `text-ink-soft`, etc.), not their plain CSS.

### Phase 3 — Bookmarks
**Effort: S · backend + frontend**

**Backend** (`learning-platform-backend/src/bookmarks/`, new module): entity `(studentId, questionId, sourceType, createdAt)` — `sourceType` distinguishes which of the four answer/question sources it came from. `POST /api/bookmarks/toggle`, `GET /api/bookmarks`.

**Frontend**: a bookmark toggle icon added to question-review UI (wherever individual questions are already rendered post-attempt — check `PracticeWorkspace.tsx` and the diagnostic review list in `analysis/[attemptId]/page.tsx` for the existing per-question row markup to extend, rather than building a new one).

### Phase 4 — Dashboard subject card grid
**Effort: S · frontend only**

`components/dashboard/SubjectOverviewGrid.tsx`, inserted into `app/(dashboard)/page.tsx` above `LearningOverview` (complements, doesn't replace, `SubjectCoverageExplorer`). Three cards (Physics/Chemistry/Math) using Phase 1's `subject-theme.ts`, each showing chapters-done ratio and average score, sourced from the `subjectCoverage` data already fetched for `StudentActionCenter` (`StudentDashboardPayload["subjectCoverage"]`) — no new backend endpoint needed here.

### Phase 5 — Mastery ladder + Bloom-grouped question review
**Effort: M · frontend only**

A `MasteryLadder` component (5-rung strip, current rung highlighted) added next to existing `BloomRadar`/`ScoreRing` usage on the analysis page, and a `BloomAccordionSection` (collapsible, grouped by Bloom level, mini progress ring per section — modeled on jee-compass's `BloomSection.jsx`) for reviewing a question set in `PracticeWorkspace.tsx` or the notebook review flow. No backend changes — this consumes Bloom-level data already returned alongside `BloomRadar`'s input.

### Phase 6 — Revision Hub (the centerpiece)
**Effort: L · backend + frontend**

**Backend**: `GET /api/revision/hub` aggregating, per student:
- Unresolved wrong answers, pulled across all four answer entities (`diagnostic-answer`, `practice-answer`, `mock-test-answer`, `learning-answer`) — this cross-entity join is the main technical complexity here.
- Bookmarks (Phase 3).
- Weak topics — reuse the weak-topic computation already in `diagnostics.service.ts` (currently scoped to one attempt), generalized to "latest known state per topic" rather than one attempt.
- Recently practiced topics — likely already derivable from `learning-topic-state.entity.ts` (adaptive module).
- Recommendations — reuse the existing `learning-resource.entity.ts` + resource-matching logic from `diagnostics.service.ts`, decoupled from a single `attemptId`.

**Frontend**: new route `app/(dashboard)/revision/page.tsx` — a tabbed hub (Queue / Wrong / Bookmarks / Weak Topics / Recent / Recommendations) with a live summary strip of counts, modeled on jee-compass's `Revision.jsx` tab structure and `rv__summary` strip, rebuilt with our `ResourceCard`/`ScoreRing` components (Phase 5) instead of duplicating them. Link into it from the dashboard (replacing or sitting beside the current `notebook` entry point — clarify with user during build which nav slot it takes).

## Verification
- Backend: `npm test` in `learning-platform-backend` after each new module (achievements, bookmarks, revision) — add a `.spec.ts` per new service following the existing pattern (e.g. `diagnostics.service.spec.ts`).
- Frontend: `npm run build` (TypeScript + route check) in `learning-platform-frontend`, then run the dev server and manually click through: earn a badge by completing a test, bookmark a question, open `/revision`, confirm the subject grid and mastery ladder render with real dashboard data.
- No visual regression on `analysis/[attemptId]` or `recommendations/[attemptId]` — those are extended, not rewritten.
