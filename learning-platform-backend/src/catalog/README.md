# Catalog (chapter study-guide metadata)

Phase 1 data layer of the JEE Compass adoption plan
(`docs/JEE-COMPASS-ADOPTION-PLAN.md`). It gives every CHAPTER-level topic the
study-guide metadata (overview, objectives, key formulas, difficulty, study
time) and the unit grouping that the future `/subjects` screens will show.

## Scope and boundaries

- Owns the `chapter_meta` table (one row per chapter topic, PK/FK
  `topic_id`, `ON DELETE CASCADE`).
- Phase 2 adds the `CatalogModule` read API and the admin review/publish endpoints (below).
- Counts that can go stale (questions, sub-topics, progress) are deliberately
  **not** stored; compute them from live tables at read time.
- The adaptive engine and `topics` hierarchy are untouched; this is an
  extension, not a replacement.

## Files

| File | Role |
|---|---|
| `chapter-meta.entity.ts` | Table + enums (`difficulty`, `source`, `status`). |
| `chapter-meta.types.ts` | Shared data shapes for the seed content and plan. |
| `catalog.controller.ts` / `catalog.service.ts` / `catalog.module.ts` | Phase 2 read model + admin endpoints. |
| `catalog.progress.ts` / `catalog.slug.ts` | Pure progress rules and URL slugs. |
| `catalog.dto.ts` / `catalog.types.ts` | Request validation and response shapes. |
| `chapter-meta.plan.ts` | Pure merge/plan logic — no DB access. |
| `../scripts/content/compass-chapters.ts` | jee-compass chapter data extracted as text (never executed). |
| `../scripts/content/compass-chapter-map.ts` | compass chapter → our chapter map + `CHAPTER_UNITS` for all 55 chapters. |
| `../scripts/content/authored-chapter-meta.ts` | Hand drafts for the 27 chapters compass has no data for. |
| `../scripts/seed-chapter-meta.ts` | Idempotent seeder with `--dry-run` report. |
| Migration `1787000000000-CreateChapterMeta` | Creates the table and enums. |

## State rules

- `source = COMPASS_IMPORT` rows are seeded `status = PUBLISHED` (they were
  reviewed during the mapping).
- `AI_DRAFT` rows (authored drafts, and any unit-only fallback) stay `DRAFT`
  and must never be shown to students. Only an admin publish flips them.
- `source = ADMIN` rows are never overwritten by the seed, and
  `jee_weightage_note` is admin-owned: the seed does not write it.

## Data model notes

- Merged rows: where several compass chapters fold into one of ours (e.g.
  its two Electrostatics chapters), overviews join, objectives/formulas
  union in order, the hardest difficulty wins, study minutes sum.
- CBSE-only compass chapters (Surface Chemistry, Polymers, Chemistry in
  Everyday Life, Linear Programming, Inverse Trigonometric Functions) are
  mapped to `null` and skipped — they are outside JEE Main.

## API (Phase 2)

All responses are wrapped as `{ data: ... }`. Subject and chapter are URL
slugs (`physics`, `d-and-f-block-elements`); lookup is case-insensitive and an
unknown or malformed slug returns 404.

| Method | Path | Who | Returns |
|---|---|---|---|
| GET | `/api/catalog/subjects` | student | per-subject counts, chapters started/mastered, average score |
| GET | `/api/catalog/progress` | student | overall and per-subject syllabus completion (Completed / In Progress / Pending counts and percent) |
| GET | `/api/catalog/subjects/:subject/chapters` | student | unit tabs + chapter cards (status, score, topic preview, question count) |
| GET | `/api/catalog/subjects/:subject/chapters/:chapter` | student | chapter summary, **published** study guide or `null`, per-topic progress, bookmark count |
| GET | `/api/catalog/subjects/:subject/analytics` | student | per-subject analytics (see below) |
| GET | `/api/catalog/subjects/:subject/chapters/:chapter/analytics` | student | the same overall / recall / application / Bloom / insights block for one chapter |
| GET | `/api/catalog/admin/chapters` | admin | every chapter with its meta source/status for review |
| PATCH | `/api/catalog/admin/chapters/:topicId/meta` | admin | edit / publish a study guide (`UpdateChapterMetaDto`) |

## One source of truth for scores

Every score the catalog returns (topic, chapter card, subject summary and the
analytics endpoints) is computed from the same set of **graded answers**,
loaded by `answer-events.query.ts` with a single `UNION ALL` over
`practice_answers`, `diagnostic_answers`, `mock_test_answers` and
`learning_answers`. So a chapter card, the subject summary and the analytics
page can never disagree. Ungraded answers (`is_correct IS NULL`) are ignored;
adaptive learning counts only the first attempt at each question; AI-generated
questions are scoped by their learning session. Question counts are PUBLISHED
questions grouped by subject/chapter/topic names, which match the `topics`
tree exactly (verified on the seeded DB).

## Syllabus progress: Completed / In Progress / Pending

`GET /api/catalog/progress` (`getSyllabusProgress`) is the single definition of
"how much of the syllabus is done"; the dashboard, the Progress screen and the
study plan must read it rather than compute their own percentage. (The older
`courseProgress.percent` on the dashboard is mastered topics divided by topics the
student has *started*, which is not syllabus completion.)

- **Denominator:** teachable topics, i.e. topics with at least one published
  question, using the same topic list the chapter pages use (tree sub-topics, or
  topics found in the questions for aliased chapters). Chapters with none are
  counted as `comingSoonChapters` and left out of the percent.
- **Per topic** (`topicLearningStatus`): **Completed** if the adaptive engine has it
  MASTERED, or its score is at least 40 with at least 5 graded answers
  (`MIN_COMPLETED_ANSWERS`; one lucky answer must not complete a topic).
  **In Progress** for any other answered or tracked topic. **Pending** otherwise.
  Scores come from graded answers in all four sources, so a practice-only student
  is never "Pending".
- **Roll-up** (`rollUpLearningStatus`): a chapter or subject is Completed when all
  its teachable topics are, Pending when none has started, else In Progress.
  Percent = completed / total, recomputed from totals when subjects are added up
  (so it is not an average of percentages).
- The chapter and topic payloads carry `learningStatus`, `teachableTopics` and
  `completedTopics` for the drill-down. The chapter cards keep their Compass
  score bands (Needs work / In progress / Mastered); the three-word set is for the
  syllabus overview and drill-down.

## Criteria ported from JEE Compass

The look, structure and API are ours; the *rules* are Compass's (see
`curriculum.js`, `SubjectDetail`, `Analytics`, the subject dashboards):

| Rule | Value | Where |
|---|---|---|
| Chapter status from score | none = Not started, below 40 = Needs work, 40-69 = In progress, 70+ = Mastered | `catalog.progress.ts` |
| Chapter "completed" | score 40+ | `COMPLETED_AT` |
| Mastery level | Beginner 0-19, Developing 20-39, Proficient 40-59, Advanced 60-79, Master 80+ (1-5 stars) | `masteryLevel` |
| Bloom levels | Remember, Understand, Apply, Analyze | `BLOOM_LEVELS` |
| Bloom / skill band | 70+ Strong, 40-69 Average, below 40 Weak | `skillBand` |
| Formula vs numerical accuracy | Remember+Understand vs everything else | `recall` / `application` |
| Strong / weak topics | 70%+ strong, below 50% weak, top 5 each (no minimum answers) | `STRONG_AT_OR_ABOVE`, `WEAK_BELOW`, `MIN_TOPIC_ANSWERS` |
| Skill-card tips | switch at 60% (Accuracy, Formula recall, Problem solving) | `skillCards` |
| Insight cards | strongest / weakest Bloom level, "practice more X", study tip from overall accuracy (<40 / <70 / else) | `insightsFor` |

A student with no answers gets `null` accuracy and no mastery level (never a
fake 0% or "Beginner"); empty weeks in the trend are `null`, not 0.
Compass's "speed" skill is not ported (answer times are not recorded for
every source).

## Subject analytics payload

`SubjectAnalytics` (`catalog.analytics.types.ts`): `overall`, `mastery`,
`skills[]`, `insights`, `recall`, `application`, `bloom[]` (per level: accuracy,
band, mastery), `chaptersCompleted`, `units[]` (for the radar), `chapters[]`,
`strongTopics[]`, `weakTopics[]`, `trend[]` (last 8 weeks, Monday-based UTC) and
`hasData`. All of it is built by the pure `buildSubjectAnalytics`.

## Chapter names: aliases and the syllabus-only rule

The catalog joins questions and learning state to the `topics` tree by **exact
chapter name**. `npm run audit:catalog` (read-only, safe on production) found
that the older Electrostatics question bank is tagged with the NCERT names
"Electric Charges and Fields" and "Electrostatic Potential and Capacitance"
(and 3 Chemistry questions with "Thermodynamics"), while the syllabus tree has
"Electrostatics" and "Chemical Thermodynamics". Without help, ~340 questions and
~50 learning states would be invisible on Subjects and Electrostatics would look
empty.

- `catalog-aliases.ts` declares those three aliases. `buildAliasResolver` applies
  an alias **only while the content-side name is not itself a tree chapter** (and
  the target is), so the moment the tree gains a real chapter of that name the
  alias turns itself off and nothing is double-counted.
- Folding happens once, in `loadContext`: question counts, learning states and
  answer events are mapped onto the tree chapter, so every later lookup is a plain
  exact-name join.
- A chapter whose tree node has no sub-topics lists the topics found in its
  published questions instead, so it can still be studied. Each topic carries a
  `scopeChapter`: the name its questions are tagged with, which is what `/learn`
  links must use (the learning engine matches questions by that exact name).
- Alias URL slugs resolve too (`/subjects/physics/electric-charges-and-fields`
  opens Electrostatics), because the learning workspace breadcrumb links by the
  content-side name.
- **Syllabus-only:** students see a tree chapter only if it has a study-guide row
  (all 55 syllabus chapters) or at least one published question. This hides
  leftover non-syllabus nodes (the dev demo seed's "Units & Math", "Current
  Elec." ...). The admin review list still shows every node.

Add a new alias in `CHAPTER_ALIASES` only after `audit:catalog` reports a
mismatch as NOT handled.

## Importing the Compass question bank

`npm run seed:compass-questions[:dry]` imports the 120 Physics Chapter 1
questions from JEE Compass (the only Compass questions with explanations; its
other files are generated placeholders or have no explanations) as **DRAFT**
questions under Physics / Electric Charges and Fields, where the existing bank
lives. They never reach a student until an admin publishes them in Content.

- Pure, tested plan in `scripts/compass-questions.plan.ts`; data in
  `scripts/content/compass-questions.ts` (extracted by text parsing, never by
  executing the Compass code).
- Two questions with duplicate options are skipped (reported, not repaired).
- **The source always lists the correct answer first.** Importing as-is would let
  a student score 100% by always picking option A, so options are re-ordered
  deterministically to balance the answer position (30 / 30 / 29 / 29).
- Idempotent by `question_id` (`CMP-PHY-CH1-...`): a re-run refreshes untouched
  drafts and leaves alone anything an admin has reviewed, edited, published or
  archived.
- `--dry-run` works without a database and, when one is configured, reports
  which topic names already exist (admins may want to retag the new ones).

## RBAC

- All student endpoints, including `/progress`, require a session and only ever
  return the caller's own data.
- Students read `PUBLISHED` study guides only; `DRAFT` rows are never serialised.
- Meta list/edit/publish are `@Roles('admin')`. Editing any content field marks
  the row `source = ADMIN` so the seed never overwrites it; publishing needs a
  non-empty overview and at least one objective, and a published row cannot be
  blanked out.
- Inputs are validated by `UpdateChapterMetaDto` (length/array caps, enums).

## Ops

```bash
npm run seed:chapter-meta:dry   # print the review report, write nothing
npm run seed:chapter-meta       # apply (idempotent; requires seed:syllabus topics)
npm run audit:catalog           # read-only: where tree and content disagree on chapter names
npm run seed:compass-questions:dry   # report what the Compass import would do
npm run seed:compass-questions       # write the DRAFT questions (idempotent)
```

