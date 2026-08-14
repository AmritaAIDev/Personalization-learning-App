import { describe, expect, it } from "vitest";
import {
  describeRoundOutcome,
  isMissTransition,
  learningTabFromSearchParams,
  learningUrl,
} from "./learning";

describe("learning helpers", () => {
  it("builds a learning url with an optional workspace tab", () => {
    expect(
      learningUrl(
        {
          subject: "Physics",
          chapter: "Electrostatics",
          topic: "Electric Field",
        },
        { tab: "practice" },
      ),
    ).toBe(
      "/learn?subject=Physics&chapter=Electrostatics&topic=Electric+Field&tab=practice",
    );
  });

  it("keeps an invalid tab query at the overview baseline", () => {
    const bad = new URLSearchParams("tab=matrix");
    const good = new URLSearchParams("tab=flashcards");
    const legacy = new URLSearchParams("tab=review");
    expect(learningTabFromSearchParams(bad as never)).toBe("overview");
    expect(learningTabFromSearchParams(good as never)).toBe("flashcards");
    expect(learningTabFromSearchParams(legacy as never)).toBe("flashcards");
  });
});

describe("round outcome copy", () => {
  it("celebrates mastery and points at durable review", () => {
    const outcome = describeRoundOutcome("MASTERED");
    expect(outcome.tone).toBe("mastered");
    expect(outcome.continueLabel).toMatch(/flashcards/i);
  });

  it("frames a demotion as rebuilding rather than failure", () => {
    const outcome = describeRoundOutcome("DEMOTED");
    expect(outcome.tone).toBe("rebuild");
    expect(outcome.title).not.toMatch(/fail/i);
  });

  it("gives every transition a distinct, actionable label", () => {
    const transitions = [
      "NONE",
      "ADVANCED",
      "REINFORCE",
      "DEMOTED",
      "PREREQUISITE",
      "MASTERED",
    ] as const;
    const titles = transitions.map(
      (transition) => describeRoundOutcome(transition).title,
    );
    expect(new Set(titles).size).toBe(transitions.length);
    for (const transition of transitions) {
      expect(
        describeRoundOutcome(transition).continueLabel.length,
      ).toBeGreaterThan(0);
    }
  });
});

describe("isMissTransition", () => {
  it("treats REINFORCE and DEMOTED as a miss", () => {
    expect(isMissTransition("REINFORCE")).toBe(true);
    expect(isMissTransition("DEMOTED")).toBe(true);
  });

  it("does not treat a hit or a terminal transition as a miss", () => {
    expect(isMissTransition("ADVANCED")).toBe(false);
    expect(isMissTransition("MASTERED")).toBe(false);
    expect(isMissTransition("PREREQUISITE")).toBe(false);
    expect(isMissTransition("NONE")).toBe(false);
  });
});
