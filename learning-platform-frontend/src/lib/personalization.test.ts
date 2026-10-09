import { describe, expect, it } from "vitest";
import type {
  AuthenticatedUser,
  PersonalizationProfile,
} from "./diagnostic-types";
import {
  DEFAULT_DAILY_MINUTES,
  formatDailyMinutes,
  planSettingsChange,
  rememberSetupSkipped,
  shouldShowSetup,
  validatePersonalization,
  valuesFromProfile,
  wasSetupSkipped,
  type PersonalizationValues,
} from "./personalization";

const NOW = new Date("2026-10-09T10:00:00Z"); // October 2026 in IST

const complete: PersonalizationValues = {
  className: "12",
  stream: "Science (PCM)",
  targetMonth: "2026-12",
  dailyMinutes: 120,
};

function user(
  overrides: Partial<AuthenticatedUser> = {},
  profile: Partial<PersonalizationProfile> = {},
): AuthenticatedUser {
  return {
    id: "u1",
    name: "Asha",
    email: "asha@example.com",
    role: "student",
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
    ...overrides,
  };
}

describe("valuesFromProfile", () => {
  it("starts a new student with the only stream and the default study time", () => {
    expect(valuesFromProfile(null)).toEqual({
      className: null,
      stream: "Science (PCM)",
      targetMonth: null,
      dailyMinutes: DEFAULT_DAILY_MINUTES,
    });
  });

  it("carries a saved profile through", () => {
    expect(
      valuesFromProfile({
        className: "11",
        stream: "Science (PCM)",
        targetMonth: "2027-02",
        dailyMinutes: 90,
        completedAt: "2026-10-01T00:00:00.000Z",
      }),
    ).toEqual({
      className: "11",
      stream: "Science (PCM)",
      targetMonth: "2027-02",
      dailyMinutes: 90,
    });
  });
});

describe("validatePersonalization", () => {
  it("accepts a complete, in-range profile", () => {
    expect(validatePersonalization(complete, { now: NOW })).toEqual({});
  });

  it("asks for everything that is missing", () => {
    const errors = validatePersonalization(
      { className: null, stream: null, targetMonth: null, dailyMinutes: 120 },
      { now: NOW },
    );
    expect(Object.keys(errors).sort()).toEqual([
      "className",
      "stream",
      "targetMonth",
    ]);
  });

  it("rejects a past month and one more than 24 months away", () => {
    expect(
      validatePersonalization({ ...complete, targetMonth: "2026-09" }, { now: NOW })
        .targetMonth,
    ).toMatch(/this month or a later one/);
    expect(
      validatePersonalization({ ...complete, targetMonth: "2028-11" }, { now: NOW })
        .targetMonth,
    ).toBeDefined();
    expect(
      validatePersonalization({ ...complete, targetMonth: "2028-10" }, { now: NOW }),
    ).toEqual({});
  });

  it("lets an unchanged, already-past month through (as the server does)", () => {
    const values = { ...complete, targetMonth: "2026-06" };
    expect(validatePersonalization(values, { now: NOW }).targetMonth).toBeDefined();
    expect(
      validatePersonalization(values, { now: NOW, unchangedMonth: "2026-06" }),
    ).toEqual({});
  });

  it("keeps daily study time between 30 and 600 whole minutes", () => {
    for (const bad of [29, 601, 90.5, Number.NaN]) {
      expect(
        validatePersonalization({ ...complete, dailyMinutes: bad }, { now: NOW })
          .dailyMinutes,
      ).toBeDefined();
    }
    for (const good of [30, 600]) {
      expect(
        validatePersonalization({ ...complete, dailyMinutes: good }, { now: NOW }),
      ).toEqual({});
    }
  });
});

describe("shouldShowSetup", () => {
  it("shows to a student with an incomplete profile", () => {
    expect(shouldShowSetup(user(), false)).toBe(true);
  });

  it("does not show once the profile is complete", () => {
    expect(
      shouldShowSetup(user({}, { completedAt: "2026-10-01T00:00:00.000Z" }), false),
    ).toBe(false);
  });

  it("never shows to admins or when signed out", () => {
    expect(shouldShowSetup(user({ role: "admin" }), false)).toBe(false);
    expect(shouldShowSetup(null, false)).toBe(false);
  });

  it("stays hidden after the student skipped it this session", () => {
    expect(shouldShowSetup(user(), true)).toBe(false);
  });
});

describe("skip memory without a browser", () => {
  it("never throws when storage is unavailable, and reads as not skipped", () => {
    expect(() => rememberSetupSkipped("u1")).not.toThrow();
    expect(wasSetupSkipped("u1")).toBe(false);
  });
});

describe("formatDailyMinutes", () => {
  it.each([
    [45, "45 min"],
    [60, "1 h"],
    [90, "1 h 30 min"],
    [120, "2 h"],
    [150, "2 h 30 min"],
  ])("formats %i", (minutes, text) => {
    expect(formatDailyMinutes(minutes)).toBe(text);
  });
});

describe("planSettingsChange", () => {
  const before: PersonalizationValues = {
    className: "12",
    stream: "Science (PCM)",
    targetMonth: "2027-01",
    dailyMinutes: 120,
  };

  it("reports no change for identical values", () => {
    expect(planSettingsChange(before, { ...before })).toBe("none");
  });

  it("asks for confirmation when the target month changes", () => {
    expect(planSettingsChange(before, { ...before, targetMonth: "2027-03" })).toBe("target");
    expect(planSettingsChange(before, { ...before, targetMonth: null })).toBe("target");
  });

  it("treats class or daily time edits as a replan, not a confirmation", () => {
    expect(planSettingsChange(before, { ...before, dailyMinutes: 180 })).toBe("replan");
    expect(planSettingsChange(before, { ...before, className: "11" })).toBe("replan");
  });

  it("does not ask for confirmation when there was no target month before", () => {
    expect(
      planSettingsChange({ ...before, targetMonth: null }, { ...before, targetMonth: "2027-01" }),
    ).toBe("replan");
  });
});
