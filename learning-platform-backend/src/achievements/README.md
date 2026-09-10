# Achievements module

Phase 2 of the jee-compass-inspired feature plan (`docs/JEE-COMPASS-INSPIRATION-PLAN.md`). Badge conditions are defined once in `achievement-definition.ts` and evaluated against real server-side stats — SUBMITTED attempt counts across diagnostics/practice/mock-tests, best score, and the student's own `xp`/`streak` — never against client-supplied data.

Evaluated on read rather than hooked into diagnostics/practice/mock-tests' own attempt-completion logic: every condition is monotonic (totals, a running best score, XP and streak only ever grow in this codebase — verified against `diagnostics.service.ts`'s `awardXpAndStreak`), so recomputing on each `GET` and persisting newly-met ones into `student_achievements` is equivalent to hooking every completion path, without touching three other services' working code. Once a row exists it stays — a badge is never revoked if the underlying stat later dips.

Subject-specific badges (`PHYSICS_ACE`, `CHEMISTRY_WIZARD`, `MATH_GENIUS`) count diagnostics + practice attempts only. Mock tests are excluded from per-subject counts — `MockTestAttempt` has no single `subject` column (one mock test spans all three), so counting it under every subject would double-count against `totalTests`.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/achievements` | earned (with `earnedAt`) and locked achievements for the signed-in student |
