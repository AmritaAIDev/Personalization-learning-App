# Catalog (chapter study-guide metadata)

Phase 1 data layer of the JEE Compass adoption plan
(`docs/JEE-COMPASS-ADOPTION-PLAN.md`). It gives every CHAPTER-level topic the
study-guide metadata (overview, objectives, key formulas, difficulty, study
time) and the unit grouping that the future `/subjects` screens will show.

## Scope and boundaries

- Owns the `chapter_meta` table (one row per chapter topic, PK/FK
  `topic_id`, `ON DELETE CASCADE`).
- Read-only consumers arrive in Phase 2 (`CatalogModule` API). Nothing here
  exposes an endpoint yet.
- Counts that can go stale (questions, sub-topics, progress) are deliberately
  **not** stored; compute them from live tables at read time.
- The adaptive engine and `topics` hierarchy are untouched; this is an
  extension, not a replacement.

## Files

| File | Role |
|---|---|
| `chapter-meta.entity.ts` | Table + enums (`difficulty`, `source`, `status`). |
| `chapter-meta.types.ts` | Shared data shapes for the seed content and plan. |
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

## RBAC

- No endpoints yet. When Phase 2 lands: students read `PUBLISHED` only;
  meta edits/publishing are admin-only.

## Ops

```bash
npm run seed:chapter-meta:dry   # print the review report, write nothing
npm run seed:chapter-meta       # apply (idempotent; requires seed:syllabus topics)
```
