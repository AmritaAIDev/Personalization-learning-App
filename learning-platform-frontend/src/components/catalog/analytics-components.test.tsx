// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { formatWeekLabel } from "@/lib/catalog";
import type {
  AnalyticsInsights,
  BloomStat,
  TrendPoint,
} from "@/lib/catalog-types";
import BloomPanel from "./BloomPanel";
import { InsightCards, SkillCards } from "./InsightCards";
import MasteryStars from "./MasteryStars";
import RadarChart from "./RadarChart";
import TrendChart from "./TrendChart";

afterEach(cleanup);

const NO_INSIGHTS: AnalyticsInsights = {
  strongestBloom: null,
  weakestBloom: null,
  focus: null,
  tip: null,
};

function level(
  name: string,
  answered: number,
  correct: number,
): BloomStat {
  const accuracy = answered === 0 ? null : Math.round((correct / answered) * 100);
  return {
    level: name,
    answered,
    correct,
    accuracy,
    band: accuracy === null ? null : accuracy >= 70 ? "Strong" : accuracy >= 40 ? "Average" : "Weak",
    mastery: null,
  };
}

describe("MasteryStars", () => {
  it("renders nothing for a null level, never a discouraging Beginner", () => {
    const { container } = render(<MasteryStars mastery={null} />);
    expect(container.textContent).toBe("");
  });

  it("shows the label, star count and distance to the next level", () => {
    render(
      <MasteryStars
        mastery={{ label: "Proficient", stars: 3, next: { label: "Advanced", pointsNeeded: 5 } }}
        showNext
      />,
    );
    expect(screen.getByText("Proficient")).toBeTruthy();
    expect(screen.getByRole("img", { name: "3 of 5 stars" })).toBeTruthy();
    expect(screen.getByText("5% more to reach Advanced")).toBeTruthy();
  });

  it("says so at the top level", () => {
    render(
      <MasteryStars mastery={{ label: "Master", stars: 5, next: null }} showNext />,
    );
    expect(screen.getByText(/reached the top level/i)).toBeTruthy();
  });
});

describe("BloomPanel", () => {
  it("explains what will appear when there is no data yet", () => {
    render(
      <BloomPanel
        bloom={[level("Remember", 0, 0)]}
        insights={NO_INSIGHTS}
        hasData={false}
        scopeLabel="this chapter"
      />,
    );
    expect(screen.getByText(/Answer a few questions in this chapter/i)).toBeTruthy();
  });

  it("shows each level with accuracy, band and a dash for untouched levels", () => {
    render(
      <BloomPanel
        bloom={[level("Remember", 3, 3), level("Understand", 0, 0), level("Apply", 3, 1)]}
        insights={{
          strongestBloom: { level: "Remember", accuracy: 100 },
          weakestBloom: { level: "Apply", accuracy: 33 },
          focus: "Practice more Apply level questions",
          tip: "Focus on Apply level questions to boost your score.",
        }}
        hasData
        scopeLabel="Physics"
      />,
    );
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.getByText("Strong")).toBeTruthy();
    expect(screen.getByText("Weak")).toBeTruthy();
    expect(screen.getByText("No answers yet")).toBeTruthy();
    expect(screen.getByText("Practice more Apply level questions")).toBeTruthy();
    expect(screen.getByText("Remember (100%)")).toBeTruthy();
  });
});

describe("InsightCards and SkillCards", () => {
  it("omits insight cards that have nothing to say", () => {
    const { container } = render(<InsightCards insights={NO_INSIGHTS} />);
    expect(container.textContent).toBe("");
  });

  it("renders skill cards with a dash and no tip while there is no data", () => {
    render(
      <SkillCards
        skills={[
          { key: "accuracy", label: "Accuracy", accuracy: null, detail: "0/0 correct", tip: null },
          { key: "recall", label: "Formula recall", accuracy: 45, detail: "9/20 recall questions", tip: "Make a formula sheet and revise daily." },
        ]}
      />,
    );
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("45%")).toBeTruthy();
    expect(screen.getByText("Make a formula sheet and revise daily.")).toBeTruthy();
  });
});

describe("RadarChart", () => {
  it("describes every axis for screen readers, including missing data", () => {
    render(
      <RadarChart
        label="Unit radar"
        points={[
          { label: "Optics", value: 80 },
          { label: "Mechanics", value: null },
          { label: "Waves", value: 40 },
        ]}
      />,
    );
    const chart = screen.getByRole("img");
    expect(chart.getAttribute("aria-label")).toBe(
      "Unit radar. Optics: 80%, Mechanics: no data, Waves: 40%",
    );
  });

  it("needs at least three axes", () => {
    const { container } = render(
      <RadarChart label="x" points={[{ label: "A", value: 1 }, { label: "B", value: 2 }]} />,
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("TrendChart", () => {
  const points: TrendPoint[] = [
    { weekStart: "2026-09-28", answered: 0, correct: 0, accuracy: null },
    { weekStart: "2026-10-05", answered: 4, correct: 3, accuracy: 75 },
  ];

  it("labels quiet weeks as having no answers, not 0%", () => {
    render(<TrendChart points={points} />);
    const label = screen.getByRole("img").getAttribute("aria-label") ?? "";
    expect(label).toContain(`week of ${formatWeekLabel("2026-09-28")}: no answers`);
    expect(label).toContain(
      `week of ${formatWeekLabel("2026-10-05")}: 75% over 4 answers`,
    );
    expect(label).not.toContain("0%");
  });
});
