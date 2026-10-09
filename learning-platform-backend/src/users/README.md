# Users module

Student identity, credential storage, role-based access control, and the student's
personalisation profile. `UsersService` enforces role validation, blocks an admin from
demoting their own role, and validates the profile a student sets for themselves.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/users/me` | current authenticated user, including `personalization` |
| PATCH | `/api/users/me/personalization` | the caller sets their own class / stream / target month / daily budget |
| GET | `/api/users` | list all users — **admin only** |
| PATCH | `/api/users/:userId/role` | promote/demote a user — **admin only** |

## Personalisation profile

Part of the Study Plan & Progress UI (`docs/STUDY-PLAN-UI-PLAN.md`). Stored on `users`
(migration `1787000100000-AddPersonalization`); every column is nullable or defaulted, so
the migration is safe to apply while the previous release is serving. The same
`personalization` object is returned by `GET /me`, the auth session endpoints and the
admin student detail, always built by `toPersonalization`.

| Field | Rule |
| --- | --- |
| `className` | `11`, `12` or `Dropper` |
| `stream` | `Science (PCM)` only: the product is JEE-only, so no PCB/NEET option is offered |
| `targetMonth` | `YYYY-MM`; not in the past and at most 24 months ahead, judged on the **IST** calendar month (servers run in UTC) |
| `dailyMinutes` | integer 30 to 600, default 120 |
| `completedAt` | set the first time class, stream and target month are all present; never reset |

Behaviour worth knowing (`users.service.ts`, `personalization.ts`):

- The endpoint always acts on the **caller**; there is no user id in the URL or body.
  `UpdatePersonalizationDto` is whitelisted, so `role`, `xp` and anything else are
  rejected by the global `ValidationPipe`.
- The month range is only enforced when the month **changes**. Re-sending the stored
  month, or editing just the stream after the month has passed, is allowed.
- The response carries `targetMonthChanged`. The client uses it to ask "Rebuild My Plan?";
  the study plan itself arrives in a later phase.
- A stored value that is no longer a valid option reads back as "not set" rather than
  breaking the profile.

## Chapter class level

`chapter_meta.class_level` (11 or 12; same migration) records which class a chapter is
taught in, so a Class 11 student is only planned Class 11 chapters. The split lives in
`scripts/content/compass-chapter-map.ts` (`CHAPTER_CLASS_LEVELS`), is written by
`npm run seed:chapter-meta`, and is a **draft for the owner to confirm**. An admin can
correct any chapter through `PATCH /api/catalog/admin/chapters/:topicId/meta`
(`classLevel`), which also marks the row admin-owned so re-seeding cannot overwrite it.

## Tests

`personalization.spec.ts` (IST month boundaries, range rules, DTO validation),
`users.service.personalization.spec.ts` (completion, no reset, range only on change,
caller-only), plus the existing role specs.
