# components/plan

The `/plan` screen: the student's day-by-day study plan.

| Component | Purpose |
| --- | --- |
| `DayPlanView` | Today's tasks, with overdue tasks from earlier days listed first. |
| `WeekPlanView` | One week at a time (Monday to Sunday): weekly completion, subject-wise tasks, each day's list. |
| `MonthPlanView` | One month at a time (current month up to the target month): planned vs completed per subject and chapter. |
| `PlanTaskRow` | One task: tick / un-tick, Skip / Restore, Start Learning. |
| `PlanEmptyState` | No plan yet: "Build my plan", or "Set up my plan" when there is no target month. |
| `PlanBits` | `PercentBar`, `StatTile`, `Stepper`, `PanelLoading`, `PanelError`. |

## Data

Everything comes from the study-plan API (`/api/study-plan/today|week|month`) through
`lib/useStudyPlan.ts`; changes go through `lib/study-plan.ts` and `lib/usePlanTaskActions.ts`.
No plan data is hard-coded. Any change to the plan fires `PLAN_UPDATED_EVENT`, so the dashboard
panels and every tab reload by themselves.

## Rules worth knowing

- Ticking a task records that the student did it. It never changes topic status or mastery;
  those only come from real answers.
- A topic completed through the student's own practice shows as done and cannot be un-ticked
  (it would flip straight back).
- Skipped tasks are neither done nor owed; Restore brings them back.
- "Today" is decided in IST.

Tests: `plan-components.test.tsx`.
