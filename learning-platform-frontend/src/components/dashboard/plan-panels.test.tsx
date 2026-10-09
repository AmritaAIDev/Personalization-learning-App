// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SyllabusProgress } from "@/lib/catalog-types";
import type {
  MonthView,
  PlanSummary,
  StudyTaskView,
  TodayView,
} from "@/lib/study-plan-types";

const mocks = vi.hoisted(() => ({
  targetMonth: "2027-01" as string | null,
  today: null as unknown,
  month: null as unknown,
  update: vi.fn(),
  generate: vi.fn(),
  requestSetup: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { personalization: { targetMonth: mocks.targetMonth } },
  }),
}));

vi.mock("@/lib/useStudyPlan", () => ({
  useTodayPlan: () => ({
    data: mocks.today,
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
  useMonthPlan: () => ({
    data: mocks.month,
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock("@/lib/study-plan", async () => {
  const actual = await vi.importActual<typeof import("@/lib/study-plan")>(
    "@/lib/study-plan",
  );
  return {
    ...actual,
    updateTaskRequest: mocks.update,
    generatePlanRequest: mocks.generate,
  };
});

vi.mock("@/lib/personalization", async () => {
  const actual = await vi.importActual<typeof import("@/lib/personalization")>(
    "@/lib/personalization",
  );
  return { ...actual, requestProfileSetup: mocks.requestSetup };
});

import SyllabusProgressPanel from "./SyllabusProgressPanel";
import TargetCard from "./TargetCard";
import TodayProgressCard from "./TodayProgressCard";

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

function today(over: Partial<TodayView> = {}): TodayView {
  const tasks = over.tasks ?? [task()];
  return {
    hasPlan: true,
    plan,
    date: "2026-10-09",
    tasks,
    overdue: [],
    totals: {
      total: tasks.length,
      completed: 0,
      percent: 0,
      estMinutes: 40,
      completedMinutes: 0,
    },
    ...over,
  };
}

beforeEach(() => {
  mocks.targetMonth = "2027-01";
  mocks.today = today();
  mocks.update.mockReset().mockResolvedValue(undefined);
  mocks.generate.mockReset().mockResolvedValue({ planned: 3 });
  mocks.requestSetup.mockReset();
});
afterEach(cleanup);

describe("TodayProgressCard", () => {
  it("shows the headline, the task and a Start Learning link", () => {
    mocks.today = today({
      tasks: [task(), task({ id: "t2", topic: "Vectors", status: "COMPLETED", completionSource: "MANUAL" })],
      totals: { total: 2, completed: 1, percent: 50, estMinutes: 80, completedMinutes: 40 },
    });
    render(<TodayProgressCard />);
    expect(screen.getByText(/1\/2 tasks completed/)).toBeTruthy();
    expect(screen.getByText("Projectile motion")).toBeTruthy();
    // only the unfinished task offers Start Learning
    expect(screen.getAllByRole("link", { name: /Start learning/i })).toHaveLength(1);
  });

  it("ticking a task records completion", async () => {
    render(<TodayProgressCard />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Projectile motion/ }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("t1", "complete"));
  });

  it("an auto-completed task is checked, disabled and explains why", () => {
    mocks.today = today({
      tasks: [task({ status: "COMPLETED", completionSource: "AUTO" })],
    });
    render(<TodayProgressCard />);
    const box = screen.getByRole("checkbox", { name: /Projectile motion/ });
    expect(box.getAttribute("aria-checked")).toBe("true");
    expect((box as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/completed from your practice/)).toBeTruthy();
  });

  it("shows a save error without losing the list", async () => {
    mocks.update.mockRejectedValue(new Error("Could not save"));
    render(<TodayProgressCard />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Projectile motion/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("Could not save");
    expect(screen.getByText("Projectile motion")).toBeTruthy();
  });

  it("counts overdue tasks and links to the plan", () => {
    mocks.today = today({ overdue: [task({ id: "o1", status: "OVERDUE" })] });
    render(<TodayProgressCard />);
    expect(screen.getByText("1 overdue")).toBeTruthy();
    expect(screen.getByRole("link", { name: /See them in your plan/ }).getAttribute("href")).toBe("/plan");
  });

  it("offers to build the plan when a target month is set but no plan exists", async () => {
    mocks.today = today({ hasPlan: false, plan: null, tasks: [] });
    render(<TodayProgressCard />);
    fireEvent.click(screen.getByRole("button", { name: "Build my plan" }));
    await waitFor(() => expect(mocks.generate).toHaveBeenCalledTimes(1));
  });

  it("asks for setup when there is no target month", () => {
    mocks.targetMonth = null;
    mocks.today = today({ hasPlan: false, plan: null, tasks: [] });
    render(<TodayProgressCard />);
    fireEvent.click(screen.getByRole("button", { name: "Set up my plan" }));
    expect(mocks.requestSetup).toHaveBeenCalledTimes(1);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});

function month(over: Partial<MonthView> = {}): MonthView {
  const totals = { total: 10, completed: 4, percent: 40, estMinutes: 400, completedMinutes: 160 };
  return {
    hasPlan: true,
    plan,
    month: "2026-10",
    daysRemaining: 114,
    subjects: [],
    totals,
    planTotals: totals,
    onTrack: { due: 5, completedDue: 4, percent: 80 },
    ...over,
  };
}

describe("TargetCard", () => {
  it("shows target month, days left, plan completion and on-track", () => {
    mocks.month = month();
    render(<TargetCard />);
    expect(screen.getByRole("heading", { name: /January 2027/ })).toBeTruthy();
    expect(screen.getByText("114")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.getByText("80%")).toBeTruthy();
    expect(screen.getByRole("link", { name: /View My Study Plan/ }).getAttribute("href")).toBe("/plan");
  });

  it("offers a rebuild when the plan is out of date", async () => {
    mocks.month = month({ plan: { ...plan, stale: true } });
    render(<TargetCard />);
    fireEvent.click(screen.getByRole("button", { name: "Rebuild it" }));
    await waitFor(() => expect(mocks.generate).toHaveBeenCalledTimes(1));
  });

  it("asks the student to set a target when there is none", () => {
    mocks.targetMonth = null;
    mocks.month = month({ hasPlan: false, plan: null, daysRemaining: null });
    render(<TargetCard />);
    fireEvent.click(screen.getByRole("button", { name: "Set my target" }));
    expect(mocks.requestSetup).toHaveBeenCalledTimes(1);
  });

  it("surfaces a rebuild failure", async () => {
    mocks.generate.mockRejectedValue(new Error("Plan service down"));
    mocks.month = month({ hasPlan: false, plan: null });
    render(<TargetCard />);
    fireEvent.click(screen.getByRole("button", { name: "Build my plan" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Plan service down");
  });
});

const syllabus: SyllabusProgress = {
  overall: { total: 10, completed: 4, inProgress: 2, pending: 4, percent: 40 },
  subjects: [
    {
      slug: "physics",
      name: "Physics",
      chapters: 5,
      comingSoonChapters: 0,
      total: 6,
      completed: 3,
      inProgress: 1,
      pending: 2,
      percent: 50,
    },
    {
      slug: "biology",
      name: "Biology",
      chapters: 1,
      comingSoonChapters: 1,
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      percent: 0,
    },
  ],
};

describe("SyllabusProgressPanel", () => {
  it("shows overall completion with remaining count and subject links", () => {
    render(
      <SyllabusProgressPanel progress={syllabus} loading={false} error={null} onRetry={vi.fn()} />,
    );
    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.getByText(/4/, { selector: "strong" })).toBeTruthy();
    expect(screen.getByText(/of 10 topics completed/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Physics/ }).getAttribute("href")).toContain("physics");
    // a subject with nothing teachable is not shown as 0%
    expect(screen.queryByText("Biology")).toBeNull();
  });

  it("explains an empty syllabus", () => {
    render(
      <SyllabusProgressPanel
        progress={{ overall: { total: 0, completed: 0, inProgress: 0, pending: 0, percent: 0 }, subjects: [] }}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/No topics are ready to study yet/)).toBeTruthy();
  });

  it("offers retry on error", () => {
    const onRetry = vi.fn();
    render(<SyllabusProgressPanel progress={null} loading={false} error="Progress could not be loaded." onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
