# Knowledge tracing (BKT)

Turns every graded answer into a per-skill **Bayesian Knowledge Tracing**
probability — the interpretability-first answer to "how close is this learner
to actually knowing this topic", replacing raw accuracy percentages for
weakness detection.

## Scope and boundaries

- Owns the `skill_mastery` table: one row per learner × skill
  (`subject` / `chapter` / `topic` — the same identity `learning_topic_state`
  uses), holding `pKnow`, `attempts`, `correct`, `lastTracedAt`.
- **Derived, never authoritative.** The snapshot is recomputed from graded
  answer events on every read (the achievements recompute-on-read pattern),
  so it can be truncated and regenerated at any time and no write path had
  to be wired into the four answer pipelines.
- Reads answers through `catalog/answer-events.query.ts` (the single
  cross-table source of graded truth: practice, diagnostics, mock tests,
  adaptive learning, first attempt only). This is a declared dependency on
  a stable catalog contract, not on catalog internals.
- Does not change adaptive level decisions yet — that is the documented
  next slice (see AI-FEATURES-ROADMAP).

## Files

| File | Role |
| --- | --- |
| `bkt.ts` | Pure model: `bktUpdate`, `bktTrace`, `masteryBand`, parameters. No DB, no Nest. |
| `skill-mastery.entity.ts` | The snapshot table. |
| `knowledge-tracing.service.ts` | Group → trace → upsert; views, summary, weak list. |
| `knowledge-tracing.controller.ts` | Student-scoped read endpoints. |
| Migration `1787000400000-CreateSkillMastery` | Additive table + unique/index. |

## Model and state rules

- P(L) starts at the prior `pL0` and folds each observation:
  correct → posterior via slip/guess, then learning transition `pT`.
- Defaults (literature-range, global): `pL0 0.2, pT 0.15, pG 0.25, pS 0.1`.
  Per-skill EM fitting is the planned follow-up (same trajectory as the
  FSRS optimiser), which is why every function takes parameters explicitly.
- Only the **last 50 observations per skill** are folded (bounded compute,
  recency-weighted by construction).
- Bands: `mastered ≥ 0.85`, `developing ≥ 0.55`, `weak` below, `unseen` at
  zero attempts. Estimates from fewer than 3 attempts are flagged
  `confidence: low` rather than hidden.
- `weakSkills` excludes single-observation noise (`attempts ≥ 2`) and
  includes shaky-but-developing skills (`pKnow < 0.65`), weakest first.

## API (student-scoped, session guard)

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/knowledge-tracing/mastery?subject=` | all tracked skills + band summary |
| GET | `/api/knowledge-tracing/weak?subject=&limit=` | focus areas, weakest first (limit 1–25) |

## UI

`components/progress/FocusAreasPanel.tsx` on `/progress` renders the weak
list with mastery bars, band + low-data chips and a Learn deep link, and
refreshes on the app-wide learning-data-updated event.

## RBAC

Read-only and self-scoped: every query is keyed by `@CurrentUser().id`.
No admin surface exists yet; cross-learner analytics are deliberately out
of scope until there is a governance story for them.
