// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CatalogChapterDetail } from "@/lib/catalog-types";
import ChapterTabs from "./ChapterTabs";
import UnitFilterTabs from "./UnitFilterTabs";

afterEach(cleanup);

describe("UnitFilterTabs", () => {
  const units = [
    { name: "Mechanics", count: 3 },
    { name: "Optics", count: 1 },
  ];

  it("shows All plus each unit with counts and marks the selected tab", () => {
    render(
      <UnitFilterTabs units={units} total={4} selected="all" onSelect={() => {}} />,
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "All chapters4",
      "Mechanics3",
      "Optics1",
    ]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("tabindex")).toBe("-1");
  });

  it("selects on click and moves selection with arrow keys, wrapping around", () => {
    const onSelect = vi.fn();
    render(
      <UnitFilterTabs units={units} total={4} selected="all" onSelect={onSelect} />,
    );
    const [all, , optics] = screen.getAllByRole("tab");
    fireEvent.click(optics);
    expect(onSelect).toHaveBeenLastCalledWith("Optics");
    fireEvent.keyDown(all, { key: "ArrowLeft" });
    expect(onSelect).toHaveBeenLastCalledWith("Optics");
    fireEvent.keyDown(all, { key: "ArrowRight" });
    expect(onSelect).toHaveBeenLastCalledWith("Mechanics");
  });
});

function detail(overrides: Partial<CatalogChapterDetail> = {}): CatalogChapterDetail {
  return {
    chapter: {
      slug: "optics",
      name: "Optics",
      subject: "Physics",
      subjectSlug: "physics",
      unit: "Optics",
      topicCount: 1,
      topicPreview: ["Lenses"],
      questionCount: 12,
      difficulty: "Hard",
      studyMinutes: 110,
      hasMeta: true,
      status: "IN_PROGRESS",
      score: 80,
      mastery: { label: "Master", stars: 5, next: null },
      masteredTopics: 0,
      startedTopics: 1,
    },
    meta: {
      overview: "Light, lenses and waves.",
      objectives: ["Use the lens formula"],
      keyFormulas: ["1/f = 1/v − 1/u"],
      difficulty: "Hard",
      studyMinutes: 110,
      jeeWeightageNote: null,
    },
    topics: [
      { name: "Lenses", status: "ACTIVE", score: 80, answered: 10, questionCount: 12 },
    ],
    bookmarkedCount: 0,
    ...overrides,
  };
}

describe("ChapterTabs", () => {
  it("shows the overview first and switches panels", () => {
    render(<ChapterTabs detail={detail()} />);
    expect(screen.getByText("Light, lenses and waves.")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Key formulas" }));
    expect(screen.getByText("1/f = 1/v − 1/u")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Topics" }));
    const link = screen.getByRole("link", { name: /Lenses/ });
    expect(link.getAttribute("href")).toContain("/learn?");
    expect(link.getAttribute("href")).toContain("topic=Lenses");
  });

  it("falls back gracefully when the study guide is not published", () => {
    render(<ChapterTabs detail={detail({ meta: null })} />);
    expect(screen.getByText(/still being written/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Objectives" }));
    expect(screen.getByText(/once the study guide is published/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Key formulas" }));
    expect(screen.getByText(/No key formulas/i)).toBeTruthy();
  });

  it("explains an empty topic list instead of rendering a blank list", () => {
    render(<ChapterTabs detail={detail({ topics: [] })} />);
    fireEvent.click(screen.getByRole("tab", { name: "Topics" }));
    expect(screen.getByText(/still being added/i)).toBeTruthy();
  });
});
