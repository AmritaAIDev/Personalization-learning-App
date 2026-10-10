// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TargetBanner from "./TargetBanner";

afterEach(cleanup);

describe("TargetBanner", () => {
  it("shows the phase, days left and target month", () => {
    render(
      <TargetBanner target={{ targetMonth: "2027-01", daysLeft: 113, phase: "consolidation" }} />,
    );
    expect(screen.getByText(/Consolidating/)).toBeTruthy();
    expect(screen.getByText(/113 days to January 2027/)).toBeTruthy();
  });

  it("uses the singular for one day", () => {
    render(<TargetBanner target={{ targetMonth: "2026-10", daysLeft: 1, phase: "sprint" }} />);
    expect(screen.getByText(/1 day to October 2026/)).toBeTruthy();
  });

  it("asks for a new target once the month has passed", () => {
    render(<TargetBanner target={{ targetMonth: "2026-08", daysLeft: 0, phase: "passed" }} />);
    expect(screen.getByText(/Target month has passed/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Set a new target/ }).getAttribute("href")).toBe("/profile");
  });
});
