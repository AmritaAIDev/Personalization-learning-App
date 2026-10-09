# Database Audit — 2026-10-10

**Scope:** the full Postgres schema behind `learning-platform-backend` (all 35
tables), audited structurally (constraints, indexes, naming, types) and
data-wise (integrity, orphans, value ranges, stale states).

**Method:** repeatable, committed tooling — `npm run audit:database`
(`src/scripts/audit-database.ts`, read-only, production-safe). Run against
both the fully-migrated throwaway database (canonical schema shape) and the
hosted Neon dev database (real data). Every finding below lists its check
code from that script.

## Final state

| Database | Critical | Warnings | Info |
| --- | --- | --- | --- |
| throwaway (canonical schema) | 0 | 0 | 21 |
| Neon (real data) | 0 | 0 | 21 |

Schema-drift check (`npm run check:schema-drift`) is clean on both. Data
integrity checks (D1–D6: probability ranges, negative growth stats, blank
required text, duplicate natural keys, future timestamps) found **zero
violations** on real data.

## Findings fixed (corrective migrations, applied to both databases)

### S4 — mixed naming conventions → `1787000500000-RenameLegacyColumnsToSnakeCase`

The prototype-era tables used quoted camelCase columns while every newer
table uses snake_case. Normalised:

| Table | Was | Now |
| --- | --- | --- |
| users | `"passwordHash"`, `"createdAt"`, `"updatedAt"` | `password_hash`, `created_at`, `updated_at` |
| topics | `"createdAt"`, `"updatedAt"` | `created_at`, `updated_at` |
| test_sessions | `"currentScore"`, `"startedAt"`, `"endedAt"`, `"updatedAt"` | snake_case equivalents |

Data-safe (`RENAME COLUMN`), reversible (`down()` restores), and the API
contract is unchanged: TypeScript property names stay camelCase, so JSON
responses are identical. A full-code search confirmed no service-level raw
SQL referenced the old quoted names.

### S7 — uuid reference columns without foreign keys → `1787000600000-AddMissingForeignKeys` + part of `1787000700000`

Eleven columns looked like foreign keys and were not enforced. Each was
orphan-checked **before** adding its constraint:

- 10 columns clean → validated FKs added (`doubts` × 4,
  `question_reports.resolved_by_user_id`,
  `targeted_practice_questions.source_question_id`,
  `notebook_mistake_reviews.question_id`,
  `notebook_concept_summaries.user_id` (CASCADE — NOT NULL user-owned),
  `question_reports.question_id` / `generated_question_id` (nullable
  polymorphic refs → SET NULL)).
- 1 column had 10 historical orphans (`misconception_hits.last_question_id`
  — questions removed after the misconception was recorded) → FK added
  `NOT VALID`: governs all new writes immediately; re-validate after a data
  pass with
  `ALTER TABLE misconception_hits VALIDATE CONSTRAINT FK_misconception_hits_last_question;`

### S1 — foreign keys without supporting indexes → `1787000700000-CompleteAuditRemediation`

Postgres does not index FK columns; each unindexed FK turns a parent-row
delete/update into a child-table sequential scan. Added 14 indexes covering
`test_sessions`, `questions`, `learning_session_items`,
`learning_generated_questions`, `tutor_messages`, `question_reports`,
`doubts`, `targeted_practice_questions`, `misconception_hits`.

## Accepted findings (INFO — documented, intentionally not changed)

- **S3 varchar status/role columns (14):** statuses are plain varchar with
  app-level enums. Converting to Postgres enums is a type change on live
  columns (rewrite + rollback complexity) for marginal gain; the audit
  keeps it visible. New tables (e.g. `chapter_meta`, `skill_mastery`)
  already use native enums.
- **S2 tables without `created_at` (6):** join tables
  (`topic_prerequisites`), the migration ledger, and tables with
  purpose-specific timestamps (`learning_sessions.started_at`,
  `skill_mastery.last_traced_at`). Adding redundant columns was rejected.
- **Naive `timestamp` (no time zone) throughout:** consistent, and all
  writes go through `now()`/`new Date()` server-side. A `timestamptz`
  migration is a whole-schema rewrite — worth scheduling only if the
  product ever serves multiple regions.

## Process notes

- Applied to the throwaway first (full rehearsal), then Neon; both
  re-audited clean afterwards.
- The rename + entity change deployed together (single restart window);
  the running dev backend was restarted and re-verified (health green,
  login works against the renamed `users` columns).
- `npm run audit:database -- --strict` exits non-zero on CRITICAL findings
  — ready to wire into CI as a gate.

## How to re-run

```bash
cd learning-platform-backend
npm run audit:database          # any DATABASE_URL, read-only
npm run check:schema-drift      # entities vs migrations agreement
```
