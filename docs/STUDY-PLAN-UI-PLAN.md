# Study Plan & Progress UI: Execution Plan (v2, reviewed against the code)

Implements the 8 changes from the UI review meeting (profile/onboarding, personalised
dashboard, target month, month/week/day study plan, today's progress, syllabus drill-down,
Progress screen + bottom nav, editable details with "Rebuild My Plan").

This is the corrected version of the first draft. The draft was checked against the
repository; section 2 lists what it got wrong and how each point is resolved. Decisions
the owner already made are in section 1.

## Principles

- All personalisation lives in Postgres behind guarded, student-scoped endpoints. No mock
  data in the UI (AGENTS.md section 8).
- The adaptive engine is not changed. The plan reads progress and links into `/learn`.
- **One definition of progress**, computed once in the backend and reused by the dashboard,
  the Progress screen and the study plan (Phase 0). Nothing re-derives its own percentage.
- Our look and architecture; progress criteria stay the JEE Compass ones already ported
  (see `learning-platform-backend/src/catalog/README.md`).
- Each phase ships alone with tests, a migration where it touches entities, and a README.

## 1. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Biology | Show only subjects whose tree is seeded (PCM today). A Biology row appears automatically if Biology topics are ever seeded. The "Biology 45%" in the review example is illustrative, not data. |
| 2 | Daily study budget | Default 120 min/day, editable at onboarding and in Profile. |
| 3 | "Completed" | A topic is **Completed** when the adaptive engine has it MASTERED, **or** its score is at least 40% **with at least 5 graded answers**. A bare "score at least 40" is not enough (one lucky answer would complete a topic). Words shown everywhere: **Completed / In Progress / Pending**. |
| 4 | Manual "Mark Complete" | Records plan-task completion only. It never changes topic status or mastery, and does not create a learning-state row. Topic status always derives from real answers. (The first draft proposed nudging the topic to In Progress; rejected because the drill-down would show progress that never happened.) |
| 5 | `GrowthPanel.tsx` | Reuse for the Progress screen (readiness rings, subject bars); delete whatever is left unused in the same change. |

Defaults chosen for the open points (change them here if the owner disagrees):

| Point | Default |
|---|---|
| Class | Stored as `11`, `12` or `Dropper`. A class value filters the plan: Class 11 gets Class 11 chapters, Class 12 gets Class 12, Dropper gets both. Needs a `class_level` column on `chapter_meta` (11, 12) seeded for all 55 chapters (Phase C migration). **Owner to confirm the 11/12 split of the 55 chapters.** |
| Stream | Short fixed list: `Science (PCM)`. Other options are not offered because the product is JEE-only and a PCB/NEET option would promise a syllabus that does not exist. |
| Overdue tasks | Stay visible as **Overdue** and count against planned-vs-completed. "Rebuild My Plan" re-spreads what is left. Automatic carry-forward is a later enhancement. |
| Target month | Must be the current month or later, and at most 24 months ahead. |
| Time zone | The server decides "today" in IST (`Asia/Kolkata`); task dates are plain dates. Production runs in UTC, so the client never computes "today" itself. |

## 2. What the first draft got wrong, and the fix

1. **"Overall syllabus completion" was not syllabus completion.** `courseProgress.percent`
   today is mastered topics divided by the topics the student has *already started*. One
   mastered topic out of two started shows "50% of the syllabus". Fix: Phase 0 defines the
   denominator as every *teachable* topic (a topic with at least one published question) and
   computes it once, in the catalog service. The dashboard reads that number.
2. **Status came from learning-state rows only.** A student who only practises or takes mock
   tests has no state row and would read "Pending" while analytics shows scores (the bug fixed
   in Catalog Phase 4). Fix: status derives from graded answers across practice, diagnostics,
   mock tests and adaptive learning (the catalog's answer events). The state row is used only
   for Mastered and Paused.
3. **"Score at least 40" alone marks a topic Completed too easily.** Fixed by decision 3
   (minimum 5 graded answers at topic level). The word set (Completed/In Progress/Pending)
   is mapped from the existing catalog statuses in one place so there are not three
   vocabularies in the app.
4. **The generator would have skipped Electrostatics.** Older chapters have no sub-topic
   nodes in the tree, and the draft keyed tasks to a `topics` foreign key. Fix: the generator
   takes its topic list from the catalog (tree topics, or the topics found in the chapter's
   published questions), and tasks are keyed by `(subject, chapter, topic)` names, storing the
   chapter name the questions use (`scopeChapter`) so "Start Learning" opens the right
   workspace. No foreign key to `topics`.
5. **No class-level data.** Fixed with `chapter_meta.class_level` (table above).
6. **"Rebuild" and missed days were undefined.** A rebuild keeps COMPLETED tasks (the weekly
   chart and planned-vs-completed need the history) and replaces only future PENDING tasks;
   OVERDUE behaviour is in the defaults table.

Smaller corrections: one endpoint for personalisation (`PATCH /api/users/me/personalization`,
whitelisted fields, not `POST /api/auth/onboarding`); the onboarding dialog is never shown to
admins; the three new dashboard panels replace the overlapping parts of
`StudentActionCenter` rather than sitting beside them; the new catalog migration has not been
run on the shared cloud database yet, so the release order in `docs/RUNBOOK.md` applies.

## 3. Status vocabulary

One pure function, `topicLearningStatus`, in `catalog.progress.ts`:

| Learning status | Rule |
|---|---|
| COMPLETED | adaptive status MASTERED, or (answered at least 5 and score at least 40) |
| IN_PROGRESS | not completed, and the topic has any graded answer or a learning-state row |
| PENDING | no answers and no state row |

A chapter or subject is COMPLETED when all its teachable topics are, PENDING when none has
started, otherwise IN_PROGRESS. Percent = completed teachable topics / all teachable topics.
Chapters with no teachable topic are listed as "coming soon" and excluded from the percent.
The existing chapter cards keep their Compass score bands (Needs work / In progress /
Mastered); the three-word set is used for the syllabus overview and the drill-down.

## 4. Data model (additive migrations, `synchronize: false`)

- `users`: `class_name varchar(20)`, `stream varchar(20)`, `target_month char(7)`,
  `daily_minutes int default 120`, `personalization_completed_at timestamp`; all nullable.
- `chapter_meta`: `class_level smallint` (11 or 12).
- `study_plans`: `id`, `user_id`, `target_month`, `daily_minutes`, `status`
  (`ACTIVE` | `STALE`), `pace_warning boolean`, `generated_at`, `params jsonb`.
- `study_plan_tasks`: `id`, `plan_id`, `date` (date), `subject`, `chapter`, `scope_chapter`,
  `topic`, `est_minutes`, `status` (`PENDING` | `COMPLETED` | `SKIPPED`), `completed_at`,
  `completion_source` (`MANUAL` | `AUTO`). `UNIQUE (plan_id, subject, chapter, topic)`: one
  task per topic per plan. OVERDUE is derived (`PENDING` and date before today), not stored.

## 5. Generator (v1: deterministic, explainable, no LLM)

Pure function `generatePlan(input) -> tasks`:

1. Take the student's teachable topics in syllabus order, for the class filter, skipping topics
   already COMPLETED.
2. Estimate minutes per topic = `chapter_meta.study_minutes / topics in chapter`, 30 minutes
   if unknown, rounded to 5.
3. From today to the end of the target month, fill each day up to `daily_minutes`, never
   splitting a topic, at most one subject per day to keep a day focused.
4. If the work does not fit, set `pace_warning`, spread the remainder evenly (never silently
   drop topics), and tell the student how many minutes a day would fit.
5. Auto-completion: on read, an open task whose topic is now COMPLETED becomes COMPLETED with
   source `AUTO` (same recompute-on-read pattern as achievements).
6. Rebuild: keep COMPLETED tasks, delete future PENDING ones, regenerate from the remaining
   topics.

## 6. API (all `SessionAuthGuard`, student-scoped)

| Endpoint | Purpose |
|---|---|
| `GET /api/catalog/progress` | Phase 0: overall + per-subject completed / in progress / pending / percent |
| `PATCH /api/users/me/personalization` | class, stream, target month, daily minutes |
| `POST /api/study-plan/generate` | build or rebuild the plan |
| `GET /api/study-plan/month?m=YYYY-MM` | planned topics, monthly %, planned vs completed |
| `GET /api/study-plan/week?d=YYYY-MM-DD` | week buckets, subject tasks, estimated time, weekly % |
| `GET /api/study-plan/today` | today's tasks and "N/M - X%" |
| `PATCH /api/study-plan/tasks/:id` | `complete`, `undo` or `skip` |

The dashboard payload gains `target: { month, daysRemaining, onTrackPercent }`, computed on
the server.

## 7. Screens

- **Onboarding dialog** after login when `personalization_completed_at` is null (students
  only): class, stream, target month (custom month grid; the native month input is not
  supported on iOS Safari), daily minutes, "Skip for now" allowed.
- **Dashboard:** Syllabus progress (overall bar, click opens `/progress`), Target card
  (month, days left, on-track %, "View My Study Plan"), Today's progress ("3/5 - 60%" with
  task checkboxes and Start Learning). Subject cards show % and completed/remaining.
- **`/plan`:** Month / Week / Day tabs; day list with checkbox, estimated time, Start Learning
  (`/learn` with the topic's `scopeChapter`); empty state asks for a target month.
- **`/progress`:** overall %, subject bars, weekly chart, streak, planned vs completed,
  target progress; every subject links into the existing `/subjects/[subject]` drill-down.
- **`/profile`:** editable class / stream / target month / daily minutes. Changing the target
  month asks: "Changing your target month will update your personalized study plan." with
  Cancel and Rebuild My Plan.
- **Navigation:** primary tabs Home, Study Plan, Learn, Progress, Profile from the single
  `navigation[]` array (desktop sidebar and mobile bottom bar); the rest stays under More.

## 8. Phases

| # | Phase | Effort | Exit check |
|---|---|---|---|
| 0 | Shared progress service: syllabus denominator, learning-status vocabulary, `GET /api/catalog/progress` | S | specs for the status rules and a hand-calculated student; `courseProgress` mislabel documented |
| A | Personalisation fields + `PATCH` endpoint + `chapter_meta.class_level` | S | typecheck, tests, schema drift clean |
| B | Kit: Modal, MonthPicker, TaskCheckbox, onboarding dialog | S | vitest for gating (students only) and the month grid |
| C | Study-plan engine: 2 tables, pure generator, recompute-on-read, endpoints | L | generator spec (pace warning, idempotent rebuild keeps completed, auto-completion, Electrostatics gets tasks); auth and 404 tests |
| D | Dashboard panels and target block | M | real seeded student shows correct %, responsive 360/768/1280 |
| E | `/plan` screens | L | status mapping and tab tests, manual walkthrough |
| F | `/progress`, navigation, editable profile and rebuild dialog | M | bottom bar matches the spec, rebuild flow verified |
| G | Demo seed and docs | S | a seeded student with a plan and mixed statuses |

## 9. Status log

### 2026-10-10: Phase 0 complete (shared progress definition)

- **Backend:** `GET /api/catalog/progress` returns overall and per-subject
  `{ total, completed, inProgress, pending, percent }` over teachable topics, plus
  `chapters` and `comingSoonChapters` per subject. Pure rules in `catalog.progress.ts`
  (`topicLearningStatus`, `rollUpLearningStatus`, `countStatuses`, `sumCounts`,
  `MIN_COMPLETED_ANSWERS = 5`). Chapter and topic payloads gained `learningStatus`,
  `teachableTopics` and `completedTopics`. Documented in
  `learning-platform-backend/src/catalog/README.md`.
- **Frontend:** matching types and a `useSyllabusProgress` hook; no screen uses them
  yet (Phase D replaces the dashboard's started-topics percentage with this).
- **Checks:** backend `tsc`, eslint, prettier clean, catalog specs 122 passing (new:
  status rules incl. the 5-answer minimum, percent-from-totals roll-up, a hand-built
  syllabus with an aliased Electrostatics chapter, a practice-only student, a brand-new
  student and the nothing-teachable case); frontend `tsc`, eslint, 103 tests clean. Over
  real HTTP on the throwaway database: 401 when unauthenticated, and a new student gets
  0% of 96 teachable topics (Physics 46, Chemistry 35, Mathematics 15).
- **Not changed on purpose:** the existing dashboard ring still reads "mastered out of
  tracked topics", which is an accurate label for what it computes. It is replaced, not
  edited, in Phase D.
- **Owner input still needed before Phase A/C:** the Class 11 / Class 12 split of the 55
  chapters (for `chapter_meta.class_level`), and a yes/no on the defaults in section 1.

### 2026-10-10: Phase A complete (personalisation fields and endpoint)

- **Schema** (migration `1787000100000-AddPersonalization`, additive, reversible):
  `users.class_name`, `stream`, `target_month`, `daily_minutes` (default 120),
  `personalization_completed_at`; `chapter_meta.class_level`. Applied, reverted and
  re-applied on the throwaway database; `check:schema-drift` clean.
- **API:** `PATCH /api/users/me/personalization` (caller only, whitelisted DTO). `GET
  /api/users/me`, the auth session endpoints and the admin student detail now return
  `personalization`; the PATCH also returns `targetMonthChanged`. Rules and rationale are
  in `learning-platform-backend/src/users/README.md`.
- **Class levels:** draft Class 11 / 12 split of the 55 chapters in `CHAPTER_CLASS_LEVELS`
  (Physics 11 + 9, Chemistry 10 + 11, Mathematics 7 + 7), seeded by `seed:chapter-meta`, and
  editable by an admin. **Owner still needs to confirm the split** (judgement calls:
  p-Block Elements and Differential Calculus are placed in Class 12).
- **Verification:** backend `tsc`, eslint, prettier clean; catalog + users + scripts specs
  193 passing, full suite in the commit below. Over real HTTP: 401 unauthenticated; a
  partial save does not complete the profile; the full save records `completedAt`; a past
  month, an unknown class and smuggled `role`/`xp` fields are rejected with clear 400s; a
  real month change returns `targetMonthChanged: true`.
- **Frontend:** `AuthenticatedUser.personalization` type added; nothing renders it yet
  (Phase B).

### 2026-10-10: Phase B complete (UI kit and onboarding dialog)

- **Kit** (`components/ui/`): `Modal` (focus in/out, Tab trap, Escape/backdrop/X unless
  `dismissible={false}`, scroll lock, bottom sheet on phones), `MonthPicker` (12-month grid
  with year arrows and disabled out-of-range months; works on iOS Safari, unlike the native
  month input), `TaskCheckbox` (whole-row checkbox, ignores taps while pending).
- **Onboarding:** `ProfileSetupDialog` mounted in the dashboard layout; students only, until
  class, stream and month are set; "Skip for now" lasts for the browser session; saving calls
  the Phase A endpoint and refreshes the signed-in user. Shared `PersonalizationForm` (reused
  by Profile in Phase F). `lib/month.ts` mirrors the backend's IST month rule.
- **Verification:** frontend `tsc`, eslint (all of `src`) and `next build` clean; **15 test
  files / 157 tests pass** (new: month helpers, profile rules and gating, Modal focus and
  keyboard behaviour, MonthPicker range and year navigation, TaskCheckbox pending/disabled,
  the form, and the dialog's gating, skip, validation, save and failure paths). Docs:
  `components/profile/README.md`.
- **Not yet:** generating the first plan after saving (Phase C).

### 2026-10-10: Phase C complete (study-plan engine)

- **Schema** (migration `1787000200000-CreateStudyPlan`, new tables only; applied, reverted and
  re-applied on the throwaway database, drift clean): `study_plans` (one per student) and
  `study_plan_tasks` (unique per plan + subject + chapter + topic, indexed by plan + date).
- **Engine:** pure scheduler `generatePlan` (one subject per day, subjects rotate, syllabus order
  kept, budget respected, pace warning with the minutes/day that would fit, nothing dropped),
  class filtering, and the Today / Week / Month views. Documented in
  `learning-platform-backend/src/study-plan/README.md`.
- **API:** `POST /generate`, `GET /today`, `GET /week`, `GET /month`, `PATCH /tasks/:id`
  (`complete`, `undo`, `skip`). Auto-completion on read from real answers; ticking never
  changes topic status (decision 4).
- **Deviations from the plan:** the stored `status` of a plan (ACTIVE/STALE) is derived instead
  (stale when the target month or daily minutes changed since generation); tasks have a
  `position` column so a day's order is stable; `CatalogService.getPlanTopics` supplies topics,
  so aliased chapters (Electrostatics) are planned too.
- **Verification:** backend `tsc`, eslint, prettier clean; study-plan module **97 tests** (full
  suite in the commit). A scripted **30-check end-to-end run** against a real server and database
  passed: 96 teachable topics planned across Oct to Dec, one subject per day within the 120
  minute budget, all topics accounted for across the months, bad dates/months/actions rejected,
  another student gets 404 on a task and sees no plan, rebuild keeps ticked tasks and re-plans
  exactly the rest, the plan turns stale when the month changes and a rebuild clears it, 401 when
  signed out.

### Phase D: dashboard personalisation (done)
- Dashboard gained **Today's Progress** (tasks with tick, Start Learning, overdue link, empty
  and error states), **Target** card (month, days left, plan done, on track, stale rebuild,
  pace note, "View My Study Plan") and **Overall Syllabus Progress** (shared definition, subject
  bars linking to the drill-down). The subject cards and the "Coverage" signal now use the same
  shared syllabus progress; the old heuristic list was retitled "Recommended next steps".
- Backend: `MonthView.planTotals` (whole-plan totals).
- **Deviation:** the dashboard payload was not extended with a `target` block; the frontend uses
  `/api/study-plan/month|today` and `/api/catalog/progress`.
- Verification: frontend tsc/eslint clean, 187 tests; study-plan module 98 backend tests.

### Phase E: /plan screens (done)
- `/plan` with Today / Week / Month tabs (reusing the catalog `Tabs` and `Breadcrumb`), a stale
  banner with Rebuild, the pace note, and an empty state that builds the plan or opens the
  profile setup. Week and Month step with previous/next (month limited to the current month up
  to the target month). Tasks can be ticked, skipped, restored, or opened with Start Learning.
- Verification: frontend tsc/eslint clean, plan component tests (14).

_(Append dated entries as phases land.)_
