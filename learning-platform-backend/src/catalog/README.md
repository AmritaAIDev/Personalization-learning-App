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
| GET | `/api/catalog/subjects/:subject/chapters` | student | unit tabs + chapter cards (status, score, topic preview, question count) |
| GET | `/api/catalog/subjects/:subject/chapters/:chapter` | student | chapter summary, **published** study guide or `null`, per-topic progress, bookmark count |
| GET | `/api/catalog/admin/chapters` | admin | every chapter with its meta source/status for review |
| PATCH | `/api/catalog/admin/chapters/:topicId/meta` | admin | edit / publish a study guide (`UpdateChapterMetaDto`) |

How progress is computed (`catalog.progress.ts`, pure and unit-tested):
topic score = correct / answered from `learning_topic_states`; chapter score =
mean of scored topics; chapter status is `MASTERED` (all topics mastered),
`NOT_STARTED`, `NEEDS_WORK` (started, mean below 40) or `IN_PROGRESS`.
Question counts are PUBLISHED questions grouped by subject/chapter/topic
names, which match the `topics` tree exactly (verified on the seeded DB).

## RBAC

- Students read `PUBLISHED` study guides only; `DRAFT` rows are never serialised.
- Meta list/edit/publish are `@Roles('admin')`. Editing any content field marks
  the row `source = ADMIN` so the seed never overwrites it; publishing needs a
  non-empty overview and at least one objective, and a published row cannot be
  blanked out.
- Inputs are validated by `UpdateChapterMetaDto` (length/array caps, enums).

## Not in this module yet

Bloom breakdown and formula-vs-numerical accuracy per subject arrive with the
Phase 4 analytics endpoint; the chapter detail deliberately stays cheap.

## Ops

```bash
npm run seed:chapter-meta:dry   # print the review report, write nothing
npm run seed:chapter-meta       # apply (idempotent; requires seed:syllabus topics)
```

