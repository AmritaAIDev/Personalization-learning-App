// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { currentMonthIST } from "@/lib/month";
import type {
  MonthView,
  PlanSummary,
  StudyTaskView,
  TodayView,
  WeekView,
} from "@/lib/study-plan-types";

const mocks = vi.hoisted(() => ({
  week: null as unknown,
  month: null as unknown,
  weekArgs: [] as Array<string | undefined>,
  monthArgs: [] as Array<string | undefined>,
  update: vi.fn(),
}));

vi.mock("@/lib/useStudyPlan", () => ({
  useWeekPlan: (date?: string) => {
    mocks.weekArgs.push(date);
    return { data: mocks.week, loading: false, error: null, reload: vi.fn() };
  },
  useMonthPlan: (month?: string) => {
    mocks.monthArgs.push(month);
    return { data: mocks.month, loading: false, error: null, reload: vi.fn() };
  },
}));

vi.mock("@/lib/study-plan", async () => {
  const actual = await vi.importActual<typeof import("@/lib/study-plan")>(
    "@/lib/study-plan",
  );
  return { ...actual, updateTaskRequest: mocks.update };
});

import DayPlanView from "./DayPlanView";
import MonthPlanView from "./MonthPlanView";
import PlanTaskRow from "./PlanTaskRow";
import WeekPlanView from "./WeekPlanView";

const plan: PlanSummary = {
  targetMonth: "2027-01",
  dailyMinutes: 120,
  generatedAt: "2026-10-01T00:00:00.000Z",
  paceWarning: false,
  requiredMinutesPerDay: 45,
  stale: false,
};

function task(over: Partial<StudyTaskView> = {}): StudyTaskView {
  return {
    id: "t1",
    date: "2026-10-09",
    subject: "Physics",
    chapter: "Kinematics",
    scopeChapter: "Kinematics",
    topic: "Projectile motion",
    estMinutes: 40,
    status: "PENDING",
    completionSource: null,
    ...over,
  };
}

const zero = { total: 0, completed: 0, percent: 0, estMinutes: 0, completedMinutes: 0 };

beforeEach(() => {
  mocks.update.mockReset().mockResolvedValue(undefined);
  mocks.weekArgs.length = 0;
  mocks.monthArgs.length = 0;
});
afterEach(cleanup);

describe("PlanTaskRow", () => {
  const noop = vi.fn();

  it("a pending task can be ticked, skipped or started", () => {
    const onAction = vi.fn();
    render(
      <ul>
        <PlanTaskRow task={task()} pending={false} onAction={onAction} />
      </ul>,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onAction).toHaveBeenLastCalledWith(expect.objectContaining({ id: "t1" }), "complete");
    fireEvent.click(screen.getByRole("button", { name: "Skip Projectile motion" }));
    expect(onAction).toHaveBeenLastCalledWith(expect.objectContaining({ id: "t1" }), "skip");
    expect(screen.getByRole("link", { name: /Start learning/ })).toBeTruthy();
  });

  it("a completed task can be un-ticked and offers no skip", () => {
    const onAction = vi.fn();
    render(
      <ul>
        <PlanTaskRow
          task={task({ status: "COMPLETED", completionSource: "MANUAL" })}
          pending={false}
          onAction={onAction}
        />
      </ul>,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onAction).toHaveBeenCalledWith(expect.anything(), "undo");
    expect(screen.queryByRole("button", { name: /Skip/ })).toBeNull();
  });

  it("a skipped task shows Restore, which un-skips it", () => {
    const onAction = vi.fn();
    render(
      <ul>
        <PlanTaskRow task={task({ status: "SKIPPED" })} pending={false} onAction={onAction} />
      </ul>,
    );
    expect(screen.getByText("Skipped")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Restore Projectile motion" }));
    expect(onAction).toHaveBeenCalledWith(expect.anything(), "undo");
  });

  it("an overdue task is flagged and shows its day", () => {
    render(
      <ul>
        <PlanTaskRow task={task({ status: "OVERDUE", date: "2026-10-05" })} pending={false} onAction={noop} showDate />
      </ul>,
    );
    expect(screen.getByText("Overdue")).toBeTruthy();
    expect(screen.getByText(/Mon, 5 Oct/)).toBeTruthy();
  });

  it("an auto-completed task cannot be un-ticked", () => {
    render(
      <ul>
        <PlanTaskRow
          task={task({ status: "COMPLETED", completionSource: "AUTO" })}
          pending={false}
          onAction={noop}
        />
      </ul>,
    );
    expect((screen.getByRole("checkbox") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("DayPlanView", () => {
  const view = (over: Partial<TodayView> = {}): TodayView => ({
    hasPlan: true,
    plan,
    date: "2026-10-09",
    tasks: [task()],
    overdue: [],
    totals: { total: 1, completed: 0, percent: 0, estMinutes: 40, completedMinutes: 0 },
    ...over,
  });

  it("lists overdue tasks first and ticks a task through the API", async () => {
    render(
      <DayPlanView view={view({ overdue: [task({ id: "o1", topic: "Vectors", status: "OVERDUE", date: "2026-10-05" })] })} />,
    );
    expect(screen.getByText("Overdue (1)")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: /Projectile motion/ }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("t1", "complete"));
  });

  it("explains an empty day", () => {
    render(<DayPlanView view={view({ tasks: [], totals: zero })} />);
    expect(screen.getByText("No tasks planned for today")).toBeTruthy();
    expect(screen.getByText(/Nothing is scheduled for today/)).toBeTruthy();
  });

  it("shows the reason when a save fails", async () => {
    mocks.update.mockRejectedValue(new Error("Could not save"));
    render(<DayPlanView view={view()} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect((await screen.findByRole("alert")).textContent).toContain("Could not save");
  });
});

describe("WeekPlanView", () => {
  const week = (): WeekView => ({
    hasPlan: true,
    plan,
    weekStart: "2026-10-05",
    weekEnd: "2026-10-11",
    days: [
      { date: "2026-10-05", tasks: [task({ id: "a", status: "COMPLETED", completionSource: "MANUAL" })] },
      { date: "2026-10-06", tasks: [] },
    ],
    subjects: [{ subject: "Physics", tasks: 1, completed: 1, estMinutes: 40 }],
    totals: { total: 1, completed: 1, percent: 100, estMinutes: 40, completedMinutes: 40 },
  });

  it("shows weekly completion, subject-wise tasks and days", () => {
    mocks.week = week();
    render(<WeekPlanView />);
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.getByText("Subject-wise")).toBeTruthy();
    expect(screen.getByText("Nothing planned.")).toBeTruthy();
  });

  it("steps a week at a time", () => {
    mocks.week = week();
    render(<WeekPlanView />);
    const first = mocks.weekArgs.at(-1) as string;
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    const next = mocks.weekArgs.at(-1) as string;
    expect(Date.parse(next) - Date.parse(first)).toBe(7 * 86_400_000);
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(mocks.weekArgs.at(-1)).toBe(first);
  });
});

describe("MonthPlanView", () => {
  const month = (): MonthView => {
    const totals = { total: 4, completed: 1, percent: 25, estMinutes: 160, completedMinutes: 40 };
    return {
      hasPlan: true,
      plan,
      month: "2027-01",
      daysRemaining: 20,
      subjects: [
        {
          subject: "Physics",
          planned: 4,
          completed: 1,
          chapters: [{ chapter: "Kinematics", planned: 4, completed: 1 }],
        },
      ],
      totals,
      planTotals: totals,
      onTrack: { due: 0, completedDue: 0, percent: 100 },
    };
  };

  it("shows planned versus completed per subject and chapter", () => {
    mocks.month = month();
    render(<MonthPlanView targetMonth="2027-01" />);
    expect(screen.getByText("1/4 topics")).toBeTruthy();
    expect(screen.getByText("Kinematics")).toBeTruthy();
    expect(screen.getByText(/Whole plan: 1 of 4 topics done \(25%\)/)).toBeTruthy();
  });

  it("cannot step past the target month", () => {
    mocks.month = month();
    render(<MonthPlanView targetMonth={currentMonthIST()} />);
    expect((screen.getByRole("button", { name: "Next month" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("steps back towards the current month", () => {
    mocks.month = month();
    render(<MonthPlanView targetMonth="2099-01" />);
    const start = mocks.monthArgs.at(-1) as string;
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(mocks.monthArgs.at(-1)).not.toBe(start);
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(mocks.monthArgs.at(-1)).toBe(start);
    // and it never goes before the current month
    expect((screen.getByRole("button", { name: "Previous month" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("says so when nothing is planned in the month", () => {
    mocks.month = { ...month(), subjects: [], totals: zero };
    render(<MonthPlanView targetMonth="2027-01" />);
    expect(screen.getByText(/No topics are planned in/)).toBeTruthy();
  });
});
