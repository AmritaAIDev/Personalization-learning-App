# JEE Compass → Learning Platform: Detailed Adoption Plan (v2)

Supersedes the scope of `JEE-COMPASS-INSPIRATION-PLAN.md`. That plan covered the *widgets* (badges, bookmarks, ladder, revision hub). This one covers what the original request is really about: **the subject → chapter → topic structure, the per-chapter and per-subject screens, and the chapter/topic data behind them**, rebuilt on our backend, in our theme.

## 1. Goal and principles

- Bring JEE Compass's **information architecture and screens** into our app, in our Tailwind tokens and components (not its CSS, not its emojis).
- All data comes from **our Postgres via backend APIs**. No static curriculum or progress in the UI, and no `localStorage` "backend" (AGENTS.md §8).
- Compass's curriculum *content* is adapted into our DB through a reviewed, idempotent seed. It is never imported as a frontend file.
- Our adaptive engine (FSRS, placement, mastery routing, Qdrant tutor) is untouched. New screens sit on top of it and link into it.
- Every phase ships on its own, has tests, a migration if it touches entities, and a module README (AGENTS.md §2, 5, 6).

## 2. What Compass actually contains (read in full)

| Compass screen | What it shows | Data source in Compass |
|---|---|---|
| `Dashboard` | welcome, XP/streak, 4 stat cards, diagnostic CTA, 3 subject cards, badges | `localStorage` + `curriculum.js` |
| `Subjects` → `SubjectDetail` | subject banner with 4 stats, overall progress bar, **unit/category filter tabs**, **chapter card grid** (Ch number, unit tag, status pill, 4 topic chips, completion ring, mastery stars, *View Chapter* / *Start-Retake*) | `curriculum.js` + `jee_subject_progress` |
| `ChapterPage` | hero (difficulty, study time, question count, exam weight), 5 stat tiles, **4 action buttons** (Practice / Quiz / Revision / Analytics), **5 tabs**: Overview, Objectives, Topics, Key Formulas, Bloom's | `chapterMeta.js`, `questions.js` |
| `Physics/Chemistry/MathDashboard` | per-subject banner, formula vs numerical accuracy, chapter score bars, unit radar, strong/weak topics (3 near-duplicate files) | test history |
| `Analytics` | 4 tabs: Dashboard, Bloom, Subjects, Trend | test history |
| `QuizPage` / `QuizResult` | timer ring, question palette, bloom tags; result with Bloom breakdown and question review | `questions.js` |
| `Revision`, `Profile`, `Diagnostic*` | already adapted (revision hub) or already stronger in our app | – |

**Compass data shapes worth adapting**
- `curriculum.js` `SUBJECTS`: 14 Physics, 14 Chemistry, 13 Maths chapters, each with `unit` (Physics/Maths) or `category` (Chemistry: Physical/Inorganic/Organic) and 5–6 `topics`.
- `chapterMeta.js` `ChapterMeta`: `overview`, `objectives[]`, `difficulty`, `studyTimeMinutes`, `questionCount`, `keyFormulas[]`, `examWeight`.
- Compass data is **CBSE Class 12**. Ours is the **JEE Main syllabus** (Class 11 + 12). `examWeight` is CBSE board marks, which is not valid for JEE.

## 3. Where we stand (audited against the repo)

**Already built (commits `0a44856`, `9acda86`, `6babe56`)**: `lib/subject-theme.ts`, `AchievementsPanel`, `SubjectOverviewGrid`, `MasteryLadder`, `BloomAccordionGroup`, `BookmarkButton` + `useBookmarkedQuestions`, `/revision` page, and the `achievements`, `bookmarks`, `revision` backend modules with migrations `1786900700000` and `1786900800000`.

**Uncommitted in the working tree** _(historical audit — resolved by Phase 0 on 2026-10-09, committed as `86f2780`/`34b6e7a`)_: 13 modified backend files, including `achievements`, `bookmarks` and `revision` specs and both migrations. Also in that set but unrelated to Compass: `agent.service.ts`, `embedding.service.ts`, `auth/roles.guard.ts`, `auth/session-auth.guard.ts`, `main.ts`, `health.controller.spec.ts`, `questions.service.spec.ts`. These must be reviewed before any new work is stacked on top.

**The real gap**

| Compass has | We have | Gap |
|---|---|---|
| Subjects browser with unit tabs and chapter card grid | Journey map (guided path, modal `SubjectCourseExplorer`) and a topic search | No browsable catalog of chapters |
| Chapter page with overview, objectives, formulas, difficulty, study time | `TopicOverview` (mastery/next step only) | **Chapter-level metadata does not exist.** `topics` only has `name`, `description`, `level`, `parent` |
| Unit / category grouping | None (`Topic` has no unit) | Needs a column |
| Per-subject analytics (formula vs numerical accuracy, unit radar, strong/weak) | Cross-subject dashboards only | No per-subject analytics endpoint or screen |
| Question counts per chapter | Questions exist in DB | Compute from DB, never hardcode |

## 4. Data adaptation strategy (the most important decision)

**4.1 Adapt metadata, not questions.** Compass's question files are small (a few hundred items, mostly CBSE style, no review trail). Ours go through governance (`QuestionPublicationStatus`, reports, calibration). Do not import Compass questions as published. *Optional later:* import Compass's `physicsChapter1Questions.js` as `DRAFT` rows for admin review only.

**4.2 Adapt chapter metadata into a new table.** Add `chapter_meta`, one row per `CHAPTER`-level topic:

| Column | Notes |
|---|---|
| `topic_id` (PK/FK → `topics.id`, cascade) | one-to-one |
| `unit` varchar | "Electrostatics", "Mechanics", "Physical" … drives filter tabs |
| `overview` text | |
| `objectives` jsonb `string[]` | |
| `key_formulas` jsonb `string[]` | stored as LaTeX; rendered with the existing `rehype-katex` stack |
| `difficulty` enum Easy/Medium/Hard | |
| `study_minutes` int | |
| `source` enum `COMPASS_IMPORT` / `AI_DRAFT` / `ADMIN` | provenance |
| `review_status` enum `DRAFT` / `PUBLISHED` | only PUBLISHED reaches students |
| `jee_weightage_note` varchar null | **not** Compass's CBSE `examWeight`; left empty unless an admin fills it |

Question count, topic count and student progress are **computed at read time** from `questions`, `topics` and `learning_topic_state`, so they cannot go stale.

**4.3 Mapping, not copying.** Create `scripts/content/compass-chapter-map.ts`: `{ compassSubject, compassChapterId } → our chapter name | null`, plus `unit` for each of our chapters. By chapter title alone, roughly 28 to 30 of the 41 Compass chapters match one of ours _(estimate at audit time; the verified dry-run result in §11: **36 of 41 compass chapters map onto 28 of our 55**, the difference being intended merges and Maths pairings — see `compass-chapter-map.ts`)_. Several merge (Compass Ch 1 and 2 → our *Electrostatics*; Ray + Wave Optics → *Optics*; Atoms + Nuclei → *Atoms and Nuclei*; Matrices + Determinants → *Matrices and Determinants*; Continuity + Applications of derivatives → *Differential Calculus*). A merged chapter's `overview` is concatenated, `objectives` and `keyFormulas` are unioned, and `studyMinutes` is summed. The **dry-run report** (section 8, Phase 1) is the source of truth for the exact counts, not this estimate.

**4.4 What happens to the rest**
- *Compass chapters with no equivalent in our syllabus* (e.g. Surface Chemistry, Polymers, Chemistry in Everyday Life, Linear Programming, Inverse Trigonometric Functions): **skipped**. They are outside JEE Main. *Decision for you:* if you also want CBSE board coverage, they become new chapters with seeded `topics`.
- *Our chapters Compass has no data for* (e.g. Kinematics, Rotational Motion, Waves, Chemical Thermodynamics, Sequences and Series): generated as `AI_DRAFT` / `DRAFT` rows using the existing `generate-chapter-content.ts` and the admin GenerationStudio, then published after admin review. They stay hidden from students until published (the UI shows a graceful "overview coming soon" for a chapter without metadata, never a broken page).
- *Compass `topics[]` chips*: **do not replace** our sub-topics (they come from `topics`, which feed practice, FSRS and Qdrant). Compass's lists are only used as a cross-check in the dry-run report to find sub-topics we might be missing.

**4.5 Text encoding.** The Compass `.js` files contain Unicode (subscripts, Greek, emoji). The seed script must read them as UTF-8, and the dry-run must show a sample of formulas to confirm nothing is garbled before inserting.

## 5. Target information architecture

```
Sidebar (add "Subjects")
 /subjects                         3 subject cards, live stats
 /subjects/[subject]               banner, unit tabs, chapter grid, link to subject analytics
 /subjects/[subject]/[chapter]     chapter hub: hero, stat tiles, actions, 5 tabs
 /subjects/[subject]/analytics     per-subject dashboard (Phase 4)
 existing: /journey  /learn  /practice  /tests  /revision  /analysis/[id]
```

- **Journey stays** as the guided, recommended path. **Subjects is the browse catalog.** The two are cross-linked ("Open in Journey" / "Browse all chapters"), so there is no duplicate concept and no confusion about which one to use.
- Route params use readable slugs (`physics`, `electrostatics`), resolved server-side to topic ids.
- All pages use the existing dashboard layout, `animate-rise`, skeleton/error/empty patterns (`useApiResource`, `EmptyState`) already used on the dashboard.

## 6. Backend design (new `CatalogModule`)

Keeps `TopicsModule` lean and puts the read-model for the browse screens in one place (AGENTS.md §1).

| Endpoint (all behind `SessionAuthGuard`; student-scoped) | Returns |
|---|---|
| `GET /api/catalog/subjects` | per subject: counts, chapters done/active, avg mastery |
| `GET /api/catalog/subjects/:subject/chapters` | chapters with `unit`, topic names (first 4 + count), question count, status, score, mastery rung, published-meta flag |
| `GET /api/catalog/subjects/:subject/chapters/:chapter` | chapter detail: meta (if PUBLISHED), sub-topics with per-topic status/score, bloom breakdown, bookmarked / wrong-answer counts, deep links |
| `GET /api/catalog/subjects/:subject/analytics` | formula-vs-numerical accuracy, unit radar series, chapter score series, strong/weak topics |
| `PATCH /api/catalog/chapters/:id/meta` | admin only: edit or publish metadata |

Implementation notes:
- Progress comes from the existing `learning_topic_state` and the same aggregation the dashboard's `subjectCoverage` uses. Extract that aggregation into a shared provider instead of duplicating it.
- "Formula accuracy" = Remember + Understand answers; "Numerical accuracy" = Apply + Analyze (Compass's definition), computed across `practice_answers`, `mock_test_answers`, `learning_answers`, `diagnostic_answers` using the join helper that already powers the revision hub.
- Add indexes where the new queries need them (verify with `EXPLAIN` on seeded data; migration for any index).
- DTOs with `class-validator`, explicit response types, no `any`, and `NotFoundException` for unknown subject/chapter slugs.
- Only `PUBLISHED` metadata is returned to students.

## 7. Frontend design

New folders `components/catalog/` (README included). Components are small and presentational; data and state live in hooks.

| Component / hook | Compass origin | Reuses |
|---|---|---|
| `useSubjects`, `useSubjectChapters`, `useChapterDetail` (wrap `useApiResource`) | – | `apiFetch`, `LEARNING_DATA_UPDATED_EVENT` refresh |
| `SubjectCard` | `Subjects.jsx` card | `subject-theme.ts` |
| `SubjectBanner` | `SubjectDetail` banner | theme gradient, `CountUp` |
| `UnitFilterTabs` | `sd__filters` | accessible `role="tablist"` |
| `ChapterCard` | `ChapterCard` | `ScoreRing`, `MasteryLadder` rung label, status pill |
| `ChapterHero`, `ChapterStatTiles` | `cp__hero`, `cp__stats` | `CountUp`, `ConfidenceBadge` |
| `ChapterActionGrid` | `ACTIONS` | links to `/learn`, `/practice`, `/revision?chapter=`, analytics, via `learningUrl` |
| `ChapterTabs`: Overview, Objectives, Topics, Formulas, Bloom | tabs | `SubtopicExplorer`, `StudyMarkdown` (KaTeX), `BloomRadar`, `BloomAccordionGroup` |
| `SubjectAnalytics` (one generic component) | the 3 dashboards | `BloomRadar`; unit radar and bar series drawn with the existing SVG approach (no new chart dependency, since the repo has no chart library) |

Design rules for every component: fluid grids (`grid-cols-1 sm:2 xl:3`), `min-w-0` and `truncate`/`line-clamp` on every text slot, 44px touch targets, `prefers-reduced-motion` respected, keyboard focus rings, light/dark via existing tokens, verified at 360, 768, 1280 px. Unit tabs scroll horizontally on small screens instead of wrapping into overflow. Long chapter names clamp to two lines.

## 8. Phased execution

Order: stabilise → data → API → screens → analytics → polish. Each phase lists deliverables, tests and the exit check.

### Phase 0: Baseline (S)
- Review the 13 uncommitted files. Split into: (a) Compass-related (`achievements`/`bookmarks`/`revision` specs + migrations), (b) unrelated hardening (auth guards, `main.ts`, agent/embedding, health). Commit each group separately to `main` (repo policy: no branches).
- Run `npm test` + `npm run build` (backend) and `npm test` + `npm run build` (frontend). Run all migrations on a clean local DB via `check-schema-drift.ts`.
- Click-through the shipped pieces: earn a badge, bookmark, open `/revision`, subject grid, mastery ladder. Record failures as a list.
- **Exit:** green tests/builds, clean `git status`, a written "known issues" list.

### Phase 1: Chapter metadata data layer (M) ✅ DELIVERED 2026-10-09 (see §11)
- Migration `CreateChapterMeta` (+ `unit` column strategy as designed in 4.2). Entity, DTOs.
- `compass-chapter-map.ts` and `seed-chapter-meta.ts` (idempotent, keyed by `topic_id`, UTF-8, dry-run flag `--dry-run` printing: mapped / merged / unmapped-compass / our-chapters-without-meta / topic-name diffs / formula sample).
- Run dry-run, **review the report with you**, then seed.
- Generate `AI_DRAFT` metadata for our uncovered chapters through the existing generation pipeline; leave `DRAFT`.
- Tests: map integrity (no duplicate targets except intended merges, every target exists in `EXISTING_CHAPTERS ∪ NEW_CHAPTERS`), merge logic, seed idempotency.
- **Exit:** every Compass-mapped chapter has `PUBLISHED` meta; the coverage report lists exactly which chapters are still draft.

### Phase 2: Catalog API (M)
- `CatalogModule` endpoints from §6, shared progress provider, admin meta endpoint, specs per service, e2e/supertest for auth (student cannot hit admin PATCH), 404s, and PUBLISHED-only filtering.
- README for the module; update `docs/` API table.
- **Exit:** `curl` the endpoints with a seeded demo student (`seed-demo-history.ts`) and get correct counts; query plans checked.

### Phase 3: Subjects and Chapter screens (L)
- `/subjects`, `/subjects/[subject]`, `/subjects/[subject]/[chapter]`, sidebar entry, loading/error/empty states, cross-links with Journey and Learn.
- Chapter page tabs per §7, with the "overview coming soon" fallback.
- Vitest + Testing Library for hooks, status mapping, unit filter, slug handling, and the no-metadata fallback.
- **Exit:** build passes; manual pass at 3 widths; no horizontal scroll; keyboard-only navigation works.

### Phase 4: Per-subject analytics (M)
- Analytics endpoint and one `SubjectAnalytics` component with Overview / Chapters / Topics tabs (Compass's three-tab layout), linked from the subject page and the chapter "Analytics" action.
- Tests on the accuracy classification and unit-radar aggregation, including empty-history states (a new student sees guidance, not zeros that look like failure).
- **Exit:** numbers match a hand-calculated seeded student.

### Phase 5: Integration polish (S)
- Dashboard `SubjectOverviewGrid` cards deep-link into `/subjects/[subject]`; `TopicSearch` results show chapter unit; chapter chips on `/revision` link back to the chapter page; command palette gets "Go to subject/chapter".
- Remove any duplicated subject→color logic still left in `JourneyMap.tsx` and others in favour of `subject-theme.ts`.
- Docs: update `docs/RUNBOOK.md` with the new seed order (`seed-jee-syllabus` → `seed-chapter-meta`).

### Phase 6: Optional extras (decide later)
- Compass-style timed **chapter quiz** shell (timer ring, question palette) over our existing practice engine, which already has question selection and review.
- Import Compass questions as `DRAFT` for admin review.
- CBSE-only chapters (see 4.4).

## 9. Cross-cutting requirements (checklist per phase)

- [ ] Migration written and run locally (no `synchronize`), schema-drift script clean
- [ ] No `any`; DTOs and shared response types; inputs validated
- [ ] Endpoints guarded, student-scoped, admin-only where noted; no PII or internal ids leaked
- [ ] External-service failures (Qdrant/LLM in the draft-generation step) handled gracefully
- [ ] Spec files alongside every new service/hook/component with logic
- [ ] Module README updated
- [ ] Responsive at 360 / 768 / 1280, no overflow, light + dark verified
- [ ] Commit to `main` directly after verification (project policy)

## 10. Risks and open questions

| # | Item | Plan |
|---|---|---|
| 1 | CBSE (Compass) vs JEE (ours) mismatch | Metadata only, mapped by chapter; CBSE-only chapters skipped unless you say otherwise; board weightage not shown |
| 2 | Chapters without Compass data | AI drafts, hidden until admin publishes |
| 3 | Subjects page vs Journey overlap | Defined roles: browse vs guided; cross-linked |
| 4 | Extra N+1 or heavy aggregates on analytics | Shared aggregation, indexes, `EXPLAIN` check, cache only if measured slow |
| 5 | Uncommitted unrelated hardening changes | Separated in Phase 0 |
| 6 | Slug stability if a chapter is renamed | Slug derived from name; redirect old slug lookups through a case-insensitive name match, covered by a test |
| 7 | I have not re-run the existing test suites or builds in this audit | Phase 0 does it first |

**Decisions (asked before Phase 1; resolved with the recommended defaults and approved 2026-10-09):**
1. CBSE-only chapters (Surface Chemistry, Polymers, Chemistry in Everyday Life, LPP, Inverse Trig) → **skipped**, mapped to `null` in `compass-chapter-map.ts` and listed in every dry-run report.
2. JEE weightage note per chapter → **none auto-filled**; the nullable `jee_weightage_note` column exists for admins only, and the seed never writes it.
3. "Subjects" → **new sidebar item** (Journey remains the guided path; the two cross-link).

## 11. Status log (dated)

### 2026-10-09 — Phase 0 + Phase 1 complete, Phase 2 not started

**Phase 0 (done, pushed as `86f2780`, `34b6e7a`, `eefa799`)**
- Auth/bootstrap repair committed; entities aligned with migrations; both test suites and both builds green.
- Schema-drift check clean on a fresh Postgres. Risk #7 above is therefore resolved.

**Phase 1 (done)**
- Table: `chapter_meta` via migration `1787000000000-CreateChapterMeta` (one row per chapter topic; PK/FK `topic_id` cascade; `unit`, `overview`, `objectives`/`key_formulas` jsonb, `difficulty`, `study_minutes`, admin-only `jee_weightage_note`, `source`, `status`). Registered in `app.module.ts` + `data-source.ts`. Module docs: `learning-platform-backend/src/catalog/README.md`.
- Content data (all reviewed in-repo; compass files were parsed as text and never executed): `compass-chapters.ts` (41), `compass-chapter-map.ts` (map + `CHAPTER_UNITS` for all 55), `authored-chapter-meta.ts` (27 hand drafts).
- Verified mapping outcome (supersedes the §4.3 estimate): **36 of 41 compass chapters → 28 of our 55 chapters** through 8 merge targets (Electrostatics, Optics, Atoms and Nuclei, Magnetic Effects, EMI & AC, Matrices and Determinants, Differential Calculus, Integral Calculus); 5 skipped as CBSE-only; 27 chapters covered by authored drafts; **0 unit-only gaps**.
- Seeder: `src/scripts/seed-chapter-meta.ts` with `--dry-run` (prints planned/merged/skipped/unit-only, compass-chip vs sub-topic diffs, UTF-8 formula samples) and npm scripts `seed:chapter-meta[:dry]`. Idempotent by `topic_id`; `ADMIN` rows and `jee_weightage_note` are never overwritten.
- Tests added: `catalog/chapter-meta.plan.spec.ts` (merge + plan logic, 13 cases) and `scripts/content/compass-chapter-map.spec.ts` (data integrity + full-plan invariants, 13 cases). Backend suite now **34 suites / 218 tests, all passing**; `nest build` and `lint:check` clean.
- Verification against a throwaway Postgres (`jee-verify-pg`:54329, no real data): all migrations + `seed-jee-syllabus` (55 chapters) + `seed:chapter-meta` → 55 rows (`COMPASS_IMPORT/PUBLISHED = 28`, `AI_DRAFT/DRAFT = 27`); re-run reported `inserted 0, updated 54, admin-owned rows left untouched 1` after manually promoting one row to `ADMIN` with a weightage note — the guard held; final `check:schema-drift` clean.
- Deviations noted: (a) authored drafts were hand-written into the repo data file instead of generated through `generate-chapter-content.ts`, because the throwaway/CI path has no LLM credentials and the file is exactly what that pipeline would need to produce for review; (b) DTOs listed in Phase 1 live in `chapter-meta.types.ts` — API request/response DTOs ship with Phase 2; (c) compass formula-less chapters (p-Block, Amines, …) are seeded with empty `key_formulas` — faithful to source, the UI fallback in Phase 3 handles it.

**Exit check (§8 Phase 1):** every compass-mapped chapter has `PUBLISHED` meta ✅; coverage report lists exactly the 27 chapters still draft ✅.

### 2026-10-09 — Phase 2 complete (Catalog API)

- `CatalogModule` (`learning-platform-backend/src/catalog/`): `GET /api/catalog/subjects`, `/subjects/:subject/chapters`, `/subjects/:subject/chapters/:chapter` (student), `GET /api/catalog/admin/chapters` and `PATCH /api/catalog/admin/chapters/:topicId/meta` (admin). Contract and RBAC are documented in `catalog/README.md`.
- Design: read model only, no new tables. Curriculum tree (`topics`) + `chapter_meta` + live PUBLISHED question counts + the student's `learning_topic_states`, joined by subject/chapter/topic **names** (verified identical on the seeded DB: 55 chapters, 0 unmatched). Draft study guides are never serialised to students. Admin edits flip `source` to `ADMIN`; publish needs an overview and one objective.
- Pure, tested logic: `catalog.progress.ts` (topic score, chapter status rules), `catalog.slug.ts` (slugs unique across all 55 chapters).
- Verification: backend `tsc`, `nest build`, `lint:check` clean; **37 suites / 246 tests pass**; service exercised against the seeded throwaway Postgres (20 Physics chapters, 8+ unit tabs, published guide visible, draft hidden, 55 review rows).
- Deviations: (a) Bloom breakdown and bookmark/wrong-answer counts beyond `bookmarkedCount` are left to Phase 4 so the chapter detail stays cheap; (b) no HTTP-level e2e yet — guards are global and covered by their own suites; add supertest when the frontend lands.

**Next up — Phase 3** (Subjects + Chapter screens, consumes the endpoints above) and **Phase 4** (per-subject analytics endpoint + screen).
