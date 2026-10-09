import { describe, expect, it } from "vitest";
import {
  addMonths,
  currentMonthIST,
  daysUntil,
  formatMonth,
  isMonth,
  isMonthInRange,
  monthsBetween,
  parseMonth,
  targetMonthBounds,
} from "./month";

describe("currentMonthIST", () => {
  it("uses the IST calendar month, not the UTC one", () => {
    expect(currentMonthIST(new Date("2026-10-31T20:00:00Z"))).toBe("2026-11");
    expect(currentMonthIST(new Date("2026-10-31T18:00:00Z"))).toBe("2026-10");
    expect(currentMonthIST(new Date("2026-12-31T19:00:00Z"))).toBe("2027-01");
  });
});

describe("month arithmetic", () => {
  it("adds months across year boundaries in both directions", () => {
    expect(addMonths("2026-10", 0)).toBe("2026-10");
    expect(addMonths("2026-10", 3)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-10", 24)).toBe("2028-10");
    expect(addMonths("2026-10", -25)).toBe("2024-09");
  });

  it("counts whole months between two months", () => {
    expect(monthsBetween("2026-10", "2026-10")).toBe(0);
    expect(monthsBetween("2026-11", "2027-02")).toBe(3);
    expect(monthsBetween("2026-10", "2026-08")).toBe(-2);
  });

  it("validates and parses YYYY-MM", () => {
    expect(isMonth("2026-12")).toBe(true);
    for (const bad of ["2026-13", "2026-00", "2026-1", "Dec 2026", ""]) {
      expect(isMonth(bad)).toBe(false);
    }
    expect(parseMonth("2026-07")).toEqual({ year: 2026, month: 7 });
    expect(() => parseMonth("nope")).toThrow();
  });
});

describe("formatMonth", () => {
  it("writes the month in words", () => {
    expect(formatMonth("2026-12")).toBe("December 2026");
    expect(formatMonth("2027-01")).toBe("January 2027");
  });

  it("falls back to the raw value, never throwing", () => {
    expect(formatMonth(null)).toBe("");
    expect(formatMonth("garbage")).toBe("garbage");
  });
});

describe("target month bounds", () => {
  const now = new Date("2026-10-09T10:00:00Z");

  it("runs from this IST month to 24 months ahead", () => {
    expect(targetMonthBounds(now)).toEqual({ min: "2026-10", max: "2028-10" });
  });

  it("checks a month against a range inclusively", () => {
    const { min, max } = targetMonthBounds(now);
    expect(isMonthInRange("2026-10", min, max)).toBe(true);
    expect(isMonthInRange("2028-10", min, max)).toBe(true);
    expect(isMonthInRange("2026-09", min, max)).toBe(false);
    expect(isMonthInRange("2028-11", min, max)).toBe(false);
    expect(isMonthInRange("bad", min, max)).toBe(false);
  });
});

describe("daysUntil", () => {
  it("counts whole calendar days, ignoring leap years and month lengths correctly", () => {
    expect(daysUntil("2026-10-09", "2026-10-09")).toBe(0);
    expect(daysUntil("2026-10-09", "2026-12-31")).toBe(83);
    expect(daysUntil("2027-12-31", "2028-03-01")).toBe(61); // 2028 is a leap year
    expect(daysUntil("2026-12-31", "2026-10-09")).toBe(-83);
  });
});
