// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "@/lib/diagnostic-types";
import { addMonths, currentMonthIST, formatMonth } from "@/lib/month";

const mocks = vi.hoisted(() => ({
  user: null as AuthenticatedUser | null,
  refreshAuth: vi.fn(),
  save: vi.fn(),
  generate: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user, refreshAuth: mocks.refreshAuth }),
}));

vi.mock("@/lib/personalization", async () => {
  const actual = await vi.importActual<typeof import("@/lib/personalization")>(
    "@/lib/personalization",
  );
  return { ...actual, savePersonalization: mocks.save };
});

vi.mock("@/lib/study-plan", () => ({ generatePlanRequest: mocks.generate }));

import StudyPlanSettings from "./StudyPlanSettings";

const thisMonth = currentMonthIST();
const nextMonth = addMonths(thisMonth, 1);

function student(targetMonth: string | null): AuthenticatedUser {
  return {
    id: "u1",
    name: "Asha",
    email: "asha@example.com",
    role: "student",
    xp: 0,
    level: 1,
    streak: 0,
    personalization: {
      className: "12",
      stream: "Science (PCM)",
      targetMonth,
      dailyMinutes: 120,
      completedAt: "2026-10-01T00:00:00.000Z",
    },
  };
}

beforeEach(() => {
  mocks.user = student(thisMonth);
  mocks.refreshAuth.mockReset().mockResolvedValue(undefined);
  mocks.save.mockReset().mockResolvedValue({ user: student(nextMonth), targetMonthChanged: true });
  mocks.generate.mockReset().mockResolvedValue({ planned: 5 });
});
afterEach(cleanup);

const save = () => screen.getByRole("button", { name: "Save changes" });

describe("StudyPlanSettings", () => {
  it("renders nothing for an admin", () => {
    mocks.user = { ...student(thisMonth), role: "admin" };
    const { container } = render(<StudyPlanSettings />);
    expect(container.textContent).toBe("");
  });

  it("says so when nothing changed", () => {
    render(<StudyPlanSettings />);
    fireEvent.click(save());
    expect(screen.getByText("There is nothing to save yet.")).toBeTruthy();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("changing the target month asks first; Cancel saves nothing", () => {
    render(<StudyPlanSettings />);
    fireEvent.click(screen.getByRole("button", { name: formatMonth(nextMonth) }));
    fireEvent.click(save());
    expect(
      screen.getByText("Changing your target month will update your personalized study plan."),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("Rebuild My Plan saves the month, rebuilds the plan and refreshes the user", async () => {
    render(<StudyPlanSettings />);
    fireEvent.click(screen.getByRole("button", { name: formatMonth(nextMonth) }));
    fireEvent.click(save());
    fireEvent.click(screen.getByRole("button", { name: "Rebuild My Plan" }));
    await waitFor(() => expect(mocks.generate).toHaveBeenCalledTimes(1));
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ targetMonth: nextMonth }));
    await waitFor(() => expect(mocks.refreshAuth).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/study plan has been rebuilt/)).toBeTruthy();
  });

  it("a daily-time change saves without asking and offers a rebuild", async () => {
    render(<StudyPlanSettings />);
    fireEvent.click(screen.getByRole("radio", { name: "3 h" }));
    fireEvent.click(save());
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    expect(mocks.generate).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Rebuild my plan" }));
    await waitFor(() => expect(mocks.generate).toHaveBeenCalledTimes(1));
  });

  it("shows the reason when saving fails and closes the confirmation", async () => {
    mocks.save.mockRejectedValue(new Error("Target month cannot be in the past."));
    render(<StudyPlanSettings />);
    fireEvent.click(screen.getByRole("button", { name: formatMonth(nextMonth) }));
    fireEvent.click(save());
    fireEvent.click(screen.getByRole("button", { name: "Rebuild My Plan" }));
    expect(await screen.findByText("Target month cannot be in the past.")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
