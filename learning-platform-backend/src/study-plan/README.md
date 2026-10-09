# Study plan module

The student's personal, dated study plan (Phase C of `docs/STUDY-PLAN-UI-PLAN.md`). It
reads the student's remaining topics from the catalog and their profile (target month, class,
daily budget) and schedules them from today to the end of the target month. It never changes
the adaptive engine, topic status or mastery.

## API (all require a session and act on the caller; no user id in any URL)

| Method | Path | Returns |
|---|---|---|
| POST | `/api/study-plan/generate` | build or rebuild the plan: `{ plan, planned, keptCompleted, unplacedTopics }` |
| GET | `/api/study-plan/today` | today's tasks, overdue tasks, and "N of M, X%" totals |
| GET | `/api/study-plan/week?d=YYYY-MM-DD` | the Monday-to-Sunday week of `d` (default this week): tasks by day, per-subject totals, weekly % |
| GET | `/api/study-plan/month?m=YYYY-MM` | the month (default the target month): planned vs completed by subject and chapter, days remaining, on-track % |
| PATCH | `/api/study-plan/tasks/:taskId` | `{ "action": "complete" \| "undo" \| "skip" }` |

`hasPlan: false` (with empty data) is returned before a plan exists, never an error.

## How the plan is built (`plan-generator.ts`, pure and deterministic)

1. **Which topics:** every teachable topic from `CatalogService.getPlanTopics` in syllabus
   order (Class 11 chapters before Class 12 within a subject), for the student's class (Class 11
   gets Class 11 chapters, Class 12 gets Class 12, Dropper gets both; a chapter with no class
   level is never hidden), skipping topics the student has already **Completed** through their
   answers or ticked off in an earlier version of the plan.
2. **How long:** a topic's share of its chapter's `study_minutes` (30 when unknown), kept between
   15 and 90 minutes, rounded to 5, and never more than one day's budget.
3. **Which day:** from today (IST) to the last day of the target month. One subject per day,
   subjects take turns, a day is filled up to the daily budget without splitting a topic, and a
   subject's topics keep their syllabus order by date.
4. **When it does not fit:** `paceWarning` is set, `requiredMinutesPerDay` says what would fit, and
   the budget is raised to that. Leftovers go onto the lightest later days of the same subject.
   **Nothing is silently dropped.** Only if the target month is already over are topics reported as
   `unplacedTopics`.

## Rules that matter

- **Rebuild keeps history.** One plan row per student. A rebuild keeps COMPLETED tasks (the weekly
  chart and planned-vs-completed need them) and replaces pending and skipped ones with a fresh
  schedule of what is still left.
- **Stale is derived.** A plan is `stale` when the student's target month or daily minutes no
  longer match the ones it was built for. The client offers "Rebuild My Plan".
- **Overdue is derived**, not stored: a pending task from an earlier day.
- **Real progress, not fake.** A pending task becomes COMPLETED with source `AUTO` on read when the
  student's own answers have completed the topic (same definition as the syllabus progress).
  Ticking a task is `MANUAL`, records only that the student did it, and **never** changes topic
  status or mastery. An `AUTO` completion cannot be un-ticked (it would flip back on the next read).
- **Skipped tasks** are left out of every total: neither done nor owed. Skipping a completed task
  is refused.
- Tasks are keyed by `(subject, chapter, topic)` names plus `scope_chapter`, the chapter name the
  questions are tagged with, so "Start learning" opens the right workspace even for aliased
  chapters such as Electrostatics. There is no foreign key to the `topics` tree on purpose.
- Someone else's task looks exactly like a missing one (404).

## Files

| File | Role |
|---|---|
| `plan-dates.ts` | `YYYY-MM-DD` arithmetic and `todayIST` (the server decides "today", in IST) |
| `plan-generator.ts` | the pure scheduler |
| `plan-topics.ts` | class filter and topic selection |
| `plan-views.ts` | pure shaping of Today / Week / Month responses and totals |
| `study-plan.service.ts` | persistence, auto-completion on read, task actions |
| `study-plan.entity.ts` + migration `1787000200000-CreateStudyPlan` | `study_plans` (one per user), `study_plan_tasks` |

## Tests

Pure units (dates, generator including 150 randomised runs that check nothing is lost or
duplicated and the order is kept, topic selection, views), the service with mocked repositories
(rebuild keeps history, class filter, auto-completion, ownership, task rules), and DTO
validation. The whole flow was also run against a real server and database.
