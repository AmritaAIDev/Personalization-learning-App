import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  LearningScope,
  LearningSessionTransition,
  LearningTab,
} from "./learning-types";

export function learningScopeFromSearchParams(
  searchParams: ReadonlyURLSearchParams,
): LearningScope | null {
  const subject = searchParams.get("subject")?.trim();
  const chapter = searchParams.get("chapter")?.trim();
  const topic = searchParams.get("topic")?.trim();
  if (!subject || !chapter || !topic) return null;
  return { subject, chapter, topic };
}

/**
 * Builds URL query params from a scope using only the three scope keys.
 *
 * Callers frequently hold a richer object (a full topic state, a recommendation
 * carrying questionCount and reason). Spreading that whole object into
 * `URLSearchParams` leaked private fields into the URL and serialised nested
 * values as "[object Object]", so every scope→params conversion goes through
 * this narrowing helper.
 */
export function scopeToParams(scope: LearningScope): URLSearchParams {
  return new URLSearchParams({
    subject: scope.subject,
    chapter: scope.chapter,
    topic: scope.topic,
  });
}

export function learningUrl(
  scope: LearningScope,
  options?: { tab?: LearningTab; placement?: "ask" },
): string {
  const params = scopeToParams(scope);
  if (options?.tab) params.set("tab", options.tab);
  if (options?.placement === "ask") params.set("placement", "ask");
  return `/learn?${params.toString()}`;
}

/**
 * Transitions reachable only by a wrong (second-attempt) answer — as
 * opposed to ADVANCED/MASTERED (a hit) or ROUTED (already stops for an
 * explicit choice regardless). Used to pause the round-outcome screen's
 * auto-continue so "try a similar one" is actually usable.
 */
export function isMissTransition(
  transition: LearningSessionTransition,
): boolean {
  return transition === "REINFORCE" || transition === "DEMOTED";
}

export type RoundOutcome = {
  title: string;
  detail: string;
  /** Drives the icon and colour treatment on the round summary card. */
  tone: "mastered" | "forward" | "rebuild";
  /** Label for the primary action, when another round is available. */
  continueLabel: string;
};

/**
 * One source of truth for how a completed round is described. Kept here rather
 * than in the view so the wording stays consistent and can be tested.
 */
export function describeRoundOutcome(
  transition: LearningSessionTransition,
): RoundOutcome {
  switch (transition) {
    case "MASTERED":
      return {
        title: "Topic mastered.",
        detail:
          "Every checkpoint for this topic is complete. Keep it durable with a short flashcard run.",
        tone: "mastered",
        continueLabel: "Review flashcards",
      };
    case "ADVANCED":
      return {
        title: "Next checkpoint unlocked.",
        detail:
          "Your recent answers give enough evidence to move up a level. The next set is already prepared.",
        tone: "forward",
        continueLabel: "Start next level",
      };
    case "PREREQUISITE":
      return {
        title: "A foundation route is better now.",
        detail:
          "A supporting idea should be strengthened first so this topic becomes easier to hold.",
        tone: "rebuild",
        continueLabel: "Open the foundation topic",
      };
    case "DEMOTED":
      return {
        title: "Stepping back to rebuild.",
        detail:
          "The next round steps back only enough to rebuild accuracy, then climbs again.",
        tone: "rebuild",
        continueLabel: "Start rebuild round",
      };
    case "REINFORCE":
      return {
        title: "One reinforcement round is ready.",
        detail:
          "The same idea needs one tighter pass before the level changes.",
        tone: "forward",
        continueLabel: "Start reinforcement round",
      };
    default:
      return {
        title: "This learning round is complete.",
        detail:
          "Your answers are saved and the next recommended checkpoint is ready.",
        tone: "forward",
        continueLabel: "Continue next round",
      };
  }
}

export function learningTabFromSearchParams(
  searchParams: ReadonlyURLSearchParams,
): LearningTab {
  const value = searchParams.get("tab");
  if (value === "review") return "flashcards";
  return value === "flashcards" || value === "practice" || value === "overview"
    ? value
    : "overview";
}
