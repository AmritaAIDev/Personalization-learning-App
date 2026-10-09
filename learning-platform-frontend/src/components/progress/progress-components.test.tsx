// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MonthView, PlanSummary, StudyTaskView, WeekView } from "@/lib/study-plan-types";

const mocks = vi.hoisted(() => ({
  month: null as unknown,
  week: null as unknown,
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { streak: 6 } }),
}));

vi.mock("@/lib/useStudyPlan", () => ({
  useMonthPlan: () => ({ data: mocks.month, loading: false, error: null, reload: vi.fn() }),
  useWeekPlan: () => ({ data: mocks.week, loading: false, error: null, reload: vi.fn() }),
}));

import PlanProgressPanel from "./PlanProgressPanel";
import WeeklyChart, { dayBars } from "./WeeklyChart";

const plan: PlanSummary = {
  targetMonth: "2027-01",
  dailyMinutes: 120,
  generatedAt: "2026-10-01T00:00:00.000Z",
  paceWarning: false,
  requiredMinutesPerDay: 45,
  stale: false,
};

function task(status: StudyTaskView["status"], id: string): StudyTaskView {
  return {
    id,
    date: "2026-10-05",
    subject: "Physics",
    chapter: "Kinematics",
    scopeChapter: "Kinematics",
    topic: `Topic ${id}`,
    estMinutes: 40,
    status,
    completionSource: null,
  };
}

const totals = { total: 10, completed: 4, percent: 40, estMinutes: 400, completedMinutes: 160 };

beforeEach(() => {
  mocks.month = {
    hasPlan: true,
    plan,
    month: "2026-10",
    daysRemaining: 114,
    subjects: [],
    totals,
    planTotals: totals,
    onTrack: { due: 5, completedDue: 4, percent: 80 },
  } satisfies MonthView;
  mocks.week = {
    hasPlan: true,
    plan,
    weekStart: "2026-10-05",
    weekEnd: "2026-10-11",
    days: [{ date: "2026-10-05", tasks: [task("COMPLETED", "a"), task("PENDING", "b")] }],
    subjects: [],
    totals: { total: 2, completed: 1, percent: 50, estMinutes: 80, completedMinutes: 40 },
  } satisfies WeekView;
});
afterEach(cleanup);

describe("dayBars", () => {
  it("counts planned and completed, leaving skipped tasks out", () => {
    const bars = dayBars([
      {
        date: "2026-10-05",
        tasks: [task("COMPLETED", "a"), task("PENDING", "b"), task("SKIPPED", "c"), task("OVERDUE", "d")],
      },
      { date: "2026-10-06", tasks: [] },
    ]);
    expect(bars).toEqual([
      { date: "2026-10-05", planned: 3, completed: 1 },
      { date: "2026-10-06", planned: 0, completed: 0 },
    ]);
  });
});

describe("WeeklyChart", () => {
  it("shows each day's completed/planned numbers as text", () => {
    render(
      <WeeklyChart
        bars={[
          { date: "2026-10-05", planned: 3, completed: 2 },
          { date: "2026-10-06", planned: 0, completed: 0 },
        ]}
      />,
    );
    expect(screen.getByText("Mon")).toBeTruthy();
    expect(screen.getByText("2/3")).toBeTruthy();
    expect(screen.getByText("0/0")).toBeTruthy();
  });
});

describe("PlanProgressPanel", () => {
  it("shows plan completion, on-track, streak and the week", () => {
    render(<PlanProgressPanel />);
    expect(screen.getByRole("heading", { name: /Progress towards January 2027/ })).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.getByText("80%")).toBeTruthy();
    expect(screen.getByText("6d")).toBeTruthy();
    expect(screen.getByText(/1 of 2 tasks done this week/)).toBeTruthy();
  });

  it("points a student without a plan to build one", () => {
    mocks.month = { ...(mocks.month as MonthView), hasPlan: false, plan: null };
    render(<PlanProgressPanel />);
    expect(screen.getByRole("link", { name: "Build one" }).getAttribute("href")).toBe("/plan");
  });
});
