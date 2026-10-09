import { describe, expect, it } from "vitest";
import {
  ALL_UNITS,
  analyticsHref,
  barTone,
  formatWeekLabel,
  skillBandFor,
  chapterHref,
  filterChaptersByUnit,
  formatStudyTime,
  pickFocusTopic,
  pluralize,
  resolveUnit,
  scoreTone,
  slugify,
  chapterHrefByName,
  matchChapters,
  subjectHref,
  subjectStats,
} from "./catalog";
import type {
  CatalogChapterSummary,
  CatalogTopicDetail,
} from "./catalog-types";

function chapter(
  overrides: Partial<CatalogChapterSummary> = {},
): CatalogChapterSummary {
  return {
    slug: "optics",
    name: "Optics",
    subject: "Physics",
    subjectSlug: "physics",
    unit: "Optics",
    topicCount: 4,
    topicPreview: [],
    questionCount: 10,
    difficulty: null,
    studyMinutes: null,
    hasMeta: false,
    status: "NOT_STARTED",
    score: null,
    mastery: null,
    masteredTopics: 0,
    startedTopics: 0,
    ...overrides,
  };
}

function topic(
  name: string,
  status: CatalogTopicDetail["status"],
  score: number | null = null,
): CatalogTopicDetail {
  return { name, status, score, answered: score === null ? 0 : 5, questionCount: 5 };
}

describe("catalog hrefs", () => {
  it("builds subject and chapter paths", () => {
    expect(subjectHref("physics")).toBe("/subjects/physics");
    expect(chapterHref("physics", "d-and-f-block-elements")).toBe(
      "/subjects/physics/d-and-f-block-elements",
    );
  });

  it("encodes unsafe characters instead of building a different path", () => {
    expect(chapterHref("physics", "a/b?c")).toBe("/subjects/physics/a%2Fb%3Fc");
  });
});

describe("formatStudyTime", () => {
  it.each([
    [null, null],
    [0, null],
    [-5, null],
    [45, "45 min"],
    [60, "1 h"],
    [90, "1 h 30 min"],
    [125, "2 h 5 min"],
  ])("formats %s", (input, expected) => {
    expect(formatStudyTime(input)).toBe(expected);
  });
});

describe("unit filtering", () => {
  const chapters = [
    chapter({ slug: "a", unit: "Mechanics" }),
    chapter({ slug: "b", unit: "Optics" }),
    chapter({ slug: "c", unit: "Mechanics" }),
    chapter({ slug: "d", unit: null }),
  ];

  it("returns everything for 'all' and only matches otherwise", () => {
    expect(filterChaptersByUnit(chapters, ALL_UNITS)).toHaveLength(4);
    expect(
      filterChaptersByUnit(chapters, "Mechanics").map((c) => c.slug),
    ).toEqual(["a", "c"]);
    expect(filterChaptersByUnit(chapters, "Nope")).toEqual([]);
  });

  it("falls back to 'all' when the selected unit disappears", () => {
    const data = { units: [{ name: "Optics", count: 1 }] };
    expect(resolveUnit(data, "Optics")).toBe("Optics");
    expect(resolveUnit(data, "Gone")).toBe(ALL_UNITS);
    expect(resolveUnit(data, ALL_UNITS)).toBe(ALL_UNITS);
  });
});

describe("subjectStats", () => {
  it("is all zeros with a null average for an empty subject", () => {
    expect(subjectStats([])).toEqual({
      chapters: 0,
      started: 0,
      mastered: 0,
      averageScore: null,
      startedPercent: 0,
    });
  });

  it("counts started/mastered and averages only scored chapters", () => {
    const stats = subjectStats([
      chapter({ status: "MASTERED", score: 90 }),
      chapter({ status: "IN_PROGRESS", score: 50 }),
      chapter({ status: "IN_PROGRESS", score: null }),
      chapter({ status: "NOT_STARTED" }),
    ]);
    expect(stats).toEqual({
      chapters: 4,
      started: 3,
      mastered: 1,
      averageScore: 70,
      startedPercent: 75,
    });
  });
});

describe("pickFocusTopic", () => {
  it("prefers the weakest active topic", () => {
    const picked = pickFocusTopic([
      topic("A", "MASTERED", 95),
      topic("B", "ACTIVE", 70),
      topic("C", "ACTIVE", 30),
      topic("D", "NOT_STARTED"),
    ]);
    expect(picked?.name).toBe("C");
  });

  it("treats an unscored active topic as least urgent among active ones", () => {
    expect(
      pickFocusTopic([topic("A", "ACTIVE"), topic("B", "ACTIVE", 60)])?.name,
    ).toBe("B");
  });

  it("falls back to untouched, then paused, then the first topic", () => {
    expect(
      pickFocusTopic([topic("A", "MASTERED", 90), topic("B", "NOT_STARTED")])
        ?.name,
    ).toBe("B");
    expect(
      pickFocusTopic([topic("A", "MASTERED", 90), topic("B", "PAUSED", 20)])
        ?.name,
    ).toBe("B");
    expect(
      pickFocusTopic([topic("A", "MASTERED", 90), topic("B", "MASTERED", 80)])
        ?.name,
    ).toBe("A");
  });

  it("returns undefined for a chapter with no topics", () => {
    expect(pickFocusTopic([])).toBeUndefined();
  });
});

describe("small helpers", () => {
  it("pluralizes", () => {
    expect(pluralize(1, "topic")).toBe("1 topic");
    expect(pluralize(0, "topic")).toBe("0 topics");
    expect(pluralize(12, "topic")).toBe("12 topics");
  });

  it("maps scores to tones", () => {
    expect(scoreTone(null)).toBe("text-ink-mute");
    expect(scoreTone(80)).toBe("text-success");
    expect(scoreTone(50)).toBe("text-warning");
    expect(scoreTone(10)).toBe("text-danger");
  });
});

describe("analytics helpers (Compass bands)", () => {
  it("skillBandFor uses the 70 / 40 cut-offs and null for no data", () => {
    expect(skillBandFor(null)).toBeNull();
    expect(skillBandFor(70)).toBe("Strong");
    expect(skillBandFor(69)).toBe("Average");
    expect(skillBandFor(40)).toBe("Average");
    expect(skillBandFor(39)).toBe("Weak");
  });

  it("barTone colours bars like Compass: 70+ green, 40+ amber, >0 red, else neutral", () => {
    expect(barTone(null)).toBe("bg-hairline");
    expect(barTone(0)).toBe("bg-hairline");
    expect(barTone(10)).toBe("bg-danger");
    expect(barTone(40)).toBe("bg-warning");
    expect(barTone(70)).toBe("bg-success");
  });

  it("formats week labels without timezone drift", () => {
    expect(formatWeekLabel("2026-10-05")).toBe("5 Oct");
    expect(formatWeekLabel("2026-01-01")).toBe("1 Jan");
    expect(formatWeekLabel("garbage")).toBe("garbage");
  });

  it("builds the analytics href", () => {
    expect(analyticsHref("physics")).toBe("/subjects/physics/analytics");
  });
});

describe("slugify (must match the backend)", () => {
  it.each([
    ["Physics", "physics"],
    ["d- and f-Block Elements", "d-and-f-block-elements"],
    ["p-Block Elements", "p-block-elements"],
    ["Work, Energy and Power", "work-energy-and-power"],
    ["Raoult’s Law & Ideal Solutions", "raoults-law-and-ideal-solutions"],
    ["  Sets, Relations and Functions  ", "sets-relations-and-functions"],
  ])("slugifies %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("builds a chapter href from display names", () => {
    expect(chapterHrefByName("Chemistry", "d- and f-Block Elements")).toBe(
      "/subjects/chemistry/d-and-f-block-elements",
    );
  });
});

describe("matchChapters (command palette)", () => {
  const chapters = [
    chapter({ slug: "optics", name: "Optics", unit: "Optics" }),
    chapter({ slug: "waves", name: "Waves", unit: "Oscillations & Waves" }),
    chapter({ slug: "wave-optics", name: "Wave Optics Extras", unit: "Optics" }),
    chapter({ slug: "solutions", name: "Solutions", subject: "Chemistry", unit: "Physical" }),
  ];

  it("matches nothing for an empty or blank query", () => {
    expect(matchChapters(chapters, "")).toEqual([]);
    expect(matchChapters(chapters, "   ")).toEqual([]);
  });

  it("matches by name, subject or unit, case-insensitively", () => {
    expect(matchChapters(chapters, "SOLUT").map((c) => c.slug)).toEqual(["solutions"]);
    expect(matchChapters(chapters, "chemistry").map((c) => c.slug)).toEqual(["solutions"]);
    expect(matchChapters(chapters, "oscillations").map((c) => c.slug)).toEqual(["waves"]);
  });

  it("ranks names that start with the query first and honours the limit", () => {
    expect(matchChapters(chapters, "wave").map((c) => c.slug)).toEqual([
      "waves",
      "wave-optics",
    ]);
    expect(matchChapters(chapters, "optics", 1)).toHaveLength(1);
  });
});
