import { describe, expect, it } from "vitest";
import {
  daysLeftLabel,
  isAutoCompleted,
  isDone,
  paceNote,
  progressHeadline,
  taskLearnHref,
} from "./study-plan";
import type { PlanSummary, StudyTaskView } from "./study-plan-types";

function task(overrides: Partial<StudyTaskView> = {}): StudyTaskView {
  return {
    id: "t1",
    date: "2026-10-09",
    subject: "Physics",
    chapter: "Electrostatics",
    scopeChapter: "Electric Charges and Fields",
    topic: "Gauss's Law",
    estMinutes: 45,
    status: "PENDING",
    completionSource: null,
    ...overrides,
  };
}

const plan = (overrides: Partial<PlanSummary> = {}): PlanSummary => ({
  targetMonth: "2026-12",
  dailyMinutes: 60,
  generatedAt: "2026-10-01T00:00:00.000Z",
  paceWarning: false,
  requiredMinutesPerDay: 60,
  stale: false,
  ...overrides,
});

describe("taskLearnHref", () => {
  it("opens the workspace on the name the topic's questions are tagged with", () => {
    const href = taskLearnHref(task());
    const params = new URLSearchParams(href.split("?")[1]);
    expect(href.startsWith("/learn?")).toBe(true);
    expect(params.get("subject")).toBe("Physics");
    expect(params.get("chapter")).toBe("Electric Charges and Fields");
    expect(params.get("topic")).toBe("Gauss's Law");
  });
});

describe("task state helpers", () => {
  it("tells done, auto-completed and open tasks apart", () => {
    expect(isDone(task({ status: "COMPLETED" }))).toBe(true);
    expect(isDone(task({ status: "OVERDUE" }))).toBe(false);
    expect(isAutoCompleted(task({ status: "COMPLETED", completionSource: "AUTO" }))).toBe(true);
    expect(isAutoCompleted(task({ status: "COMPLETED", completionSource: "MANUAL" }))).toBe(false);
    expect(isAutoCompleted(task())).toBe(false);
  });
});

describe("daysLeftLabel", () => {
  it.each([
    [83, "83 days left"],
    [2, "2 days left"],
    [1, "1 day left"],
    [0, "Last day"],
    [-3, "Ended"],
    [null, ""],
  ])("%s -> %s", (days, label) => {
    expect(daysLeftLabel(days)).toBe(label);
  });
});

describe("paceNote", () => {
  it("says nothing when the plan fits", () => {
    expect(paceNote(plan())).toBeNull();
  });

  it("explains in plain words what daily time would fit", () => {
    expect(
      paceNote(plan({ paceWarning: true, dailyMinutes: 60, requiredMinutesPerDay: 90 })),
    ).toBe(
      "At 1 h a day you will not finish everything by your target month. About 1 h 30 min a day would fit.",
    );
  });
});

describe("progressHeadline", () => {
  it("reads like the review example", () => {
    expect(progressHeadline({ completed: 3, total: 5, percent: 60 })).toBe(
      "3/5 tasks completed - 60%",
    );
    expect(progressHeadline({ completed: 0, total: 1, percent: 0 })).toBe(
      "0/1 task completed - 0%",
    );
  });
});
