// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { OPEN_PROFILE_SETUP_EVENT } from "@/lib/personalization";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "@/lib/diagnostic-types";
import { currentMonthIST, formatMonth } from "@/lib/month";
import PersonalizationForm from "./PersonalizationForm";

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

vi.mock("@/lib/study-plan", () => ({
  generatePlanRequest: mocks.generate,
}));

import ProfileSetupDialog from "./ProfileSetupDialog";

function studentUser(
  profile: Partial<AuthenticatedUser["personalization"]> = {},
  role: AuthenticatedUser["role"] = "student",
): AuthenticatedUser {
  return {
    id: "u1",
    name: "Asha",
    email: "asha@example.com",
    role,
    xp: 0,
    level: 1,
    streak: 0,
    personalization: {
      className: null,
      stream: null,
      targetMonth: null,
      dailyMinutes: 120,
      completedAt: null,
      ...profile,
    },
  };
}

const SKIP_KEY = "jee-ai:profile-setup-skipped:u1";

beforeEach(() => {
  mocks.user = studentUser();
  mocks.refreshAuth.mockReset().mockResolvedValue(undefined);
  mocks.generate.mockReset().mockResolvedValue({ planned: 12 });
  mocks.save.mockReset().mockResolvedValue({
    user: studentUser(),
    targetMonthChanged: true,
  });
  window.sessionStorage.clear();
});
afterEach(cleanup);

const dialogName = "Set up your study plan";
const thisMonthButton = () =>
  screen.getByRole("button", { name: formatMonth(currentMonthIST()) });

describe("PersonalizationForm", () => {
  const initial = {
    className: null,
    stream: "Science (PCM)" as const,
    targetMonth: null,
    dailyMinutes: 120,
  };

  function renderForm(onSubmit = vi.fn(), error?: string) {
    render(
      <>
        <PersonalizationForm
          formId="f"
          initial={initial}
          onSubmit={onSubmit}
          error={error}
        />
        <button type="submit" form="f">
          save
        </button>
      </>,
    );
    return onSubmit;
  }

  it("blocks submit and names what is missing", () => {
    const onSubmit = renderForm();
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Choose your class.")).toBeTruthy();
    expect(screen.getByText("Pick the month you are aiming for.")).toBeTruthy();
  });

  it("submits the chosen values once everything is filled in", () => {
    const onSubmit = renderForm();
    fireEvent.click(screen.getByRole("radio", { name: "Class 12" }));
    fireEvent.click(thisMonthButton());
    fireEvent.click(screen.getByRole("radio", { name: "3 h" }));
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(onSubmit).toHaveBeenCalledWith({
      className: "12",
      stream: "Science (PCM)",
      targetMonth: currentMonthIST(),
      dailyMinutes: 180,
    });
  });

  it("clears a field's error as soon as it is fixed", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(screen.getByText("Choose your class.")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Class 11" }));
    expect(screen.queryByText("Choose your class.")).toBeNull();
  });

  it("shows a server error above the fields", () => {
    renderForm(vi.fn(), "Target month cannot be in the past.");
    expect(screen.getByRole("alert").textContent).toContain("cannot be in the past");
  });

  it("marks exactly one option per group as selected", () => {
    renderForm();
    fireEvent.click(screen.getByRole("radio", { name: "Dropper / Repeater" }));
    const checked = screen
      .getAllByRole("radio")
      .filter((radio) => radio.getAttribute("aria-checked") === "true")
      .map((radio) => radio.textContent);
    expect(checked).toEqual(["Dropper / Repeater", "Science (PCM)", "2 h"]);
  });
});

describe("ProfileSetupDialog", () => {
  it("asks a student with an incomplete profile to set up their plan", async () => {
    render(<ProfileSetupDialog />);
    expect(await screen.findByRole("dialog", { name: dialogName })).toBeTruthy();
  });

  it.each([
    ["an admin", () => studentUser({}, "admin")],
    [
      "a student whose profile is already complete",
      () => studentUser({ completedAt: "2026-10-01T00:00:00.000Z" }),
    ],
  ])("stays closed for %s", async (_label, make) => {
    mocks.user = make();
    render(<ProfileSetupDialog />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays closed when signed out", async () => {
    mocks.user = null;
    render(<ProfileSetupDialog />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not reappear once skipped in this browser session", async () => {
    window.sessionStorage.setItem(SKIP_KEY, "1");
    render(<ProfileSetupDialog />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("'Skip for now' closes it and remembers for the session", async () => {
    render(<ProfileSetupDialog />);
    await screen.findByRole("dialog", { name: dialogName });
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    // The dialog plays its exit before unmounting.
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.sessionStorage.getItem(SKIP_KEY)).toBe("1");
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("does not call the server while required fields are missing", async () => {
    render(<ProfileSetupDialog />);
    await screen.findByRole("dialog", { name: dialogName });
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));
    expect(mocks.save).not.toHaveBeenCalled();
    expect(screen.getByText("Choose your class.")).toBeTruthy();
  });

  it("saves the profile and refreshes the signed-in user", async () => {
    render(<ProfileSetupDialog />);
    await screen.findByRole("dialog", { name: dialogName });
    fireEvent.click(screen.getByRole("radio", { name: "Class 12" }));
    fireEvent.click(thisMonthButton());
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    expect(mocks.save).toHaveBeenCalledWith({
      className: "12",
      stream: "Science (PCM)",
      targetMonth: currentMonthIST(),
      dailyMinutes: 120,
    });
    await waitFor(() => expect(mocks.refreshAuth).toHaveBeenCalledTimes(1));
    // the first plan is built straight after the profile is saved
    expect(mocks.generate).toHaveBeenCalledTimes(1);
  });

  it("still finishes when building the plan fails: the profile is saved, the dashboard offers 'Build my plan'", async () => {
    mocks.generate.mockRejectedValue(new Error("plan service down"));
    render(<ProfileSetupDialog />);
    await screen.findByRole("dialog", { name: dialogName });
    fireEvent.click(screen.getByRole("radio", { name: "Class 12" }));
    fireEvent.click(thisMonthButton());
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));
    await waitFor(() => expect(mocks.refreshAuth).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("plan service down")).toBeNull();
  });

  it("opens on request even after being skipped, but never for an admin", async () => {
    window.sessionStorage.setItem(SKIP_KEY, "1");
    const { unmount } = render(<ProfileSetupDialog />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => {
      window.dispatchEvent(new Event(OPEN_PROFILE_SETUP_EVENT));
    });
    expect(await screen.findByRole("dialog", { name: dialogName })).toBeTruthy();
    unmount();

    mocks.user = studentUser({}, "admin");
    render(<ProfileSetupDialog />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    act(() => {
      window.dispatchEvent(new Event(OPEN_PROFILE_SETUP_EVENT));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the dialog open and shows the reason when saving fails", async () => {
    mocks.save.mockRejectedValue(new Error("Target month cannot be in the past."));
    render(<ProfileSetupDialog />);
    await screen.findByRole("dialog", { name: dialogName });
    fireEvent.click(screen.getByRole("radio", { name: "Class 11" }));
    fireEvent.click(thisMonthButton());
    fireEvent.click(screen.getByRole("button", { name: "Save and continue" }));
    expect(await screen.findByText("Target month cannot be in the past.")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: dialogName })).toBeTruthy();
    expect(mocks.refreshAuth).not.toHaveBeenCalled();
    // and the student can try again
    expect(
      (screen.getByRole("button", { name: "Save and continue" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
});
