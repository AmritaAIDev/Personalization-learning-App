# components/progress

Building blocks of the `/progress` screen.

- `PlanProgressPanel`: plan completion, on-track %, days left, streak, planned vs completed and
  this week's chart. Data: `/api/study-plan/month` and `/week` through `lib/useStudyPlan.ts`.
- `WeeklyChart` / `dayBars`: one bar per day, completed out of planned (skipped tasks are not owed).

The screen also reuses `dashboard/SyllabusProgressPanel` (shared syllabus definition, each subject
links into the Subject > Chapter > Topic drill-down) and `dashboard/GrowthPanel` (mastery from
real practice). Tests: `progress-components.test.tsx`.
