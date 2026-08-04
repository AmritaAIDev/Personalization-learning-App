import {
  LearningSessionTransition,
  nextCoordinate,
  previousCoordinate,
} from './adaptive.types';

export type CompletionDecision = {
  transition:
    | LearningSessionTransition.ADVANCED
    | LearningSessionTransition.MASTERED
    | LearningSessionTransition.REINFORCE;
  nextLevel: number | null;
};

/**
 * A round advances when the learner resolved enough questions on the first try.
 * The old gate demanded a perfect 5-streak, so a single recovered miss voided
 * the whole round. Advancing on >= 80% first-try accuracy (4 of 5) keeps the
 * standard high while forgiving one recovered slip.
 */
export function resolveCoordinateCompletion(
  currentLevel: number,
  firstTryCorrect: number,
  totalQuestions: number,
): CompletionDecision {
  const advanceThreshold = Math.ceil(totalQuestions * 0.8);
  if (firstTryCorrect < advanceThreshold) {
    return {
      transition: LearningSessionTransition.REINFORCE,
      nextLevel: currentLevel,
    };
  }
  const following = nextCoordinate(currentLevel);
  if (following) {
    return {
      transition: LearningSessionTransition.ADVANCED,
      nextLevel: following.level,
    };
  }
  return { transition: LearningSessionTransition.MASTERED, nextLevel: null };
}

export function resolveSecondFailure(
  currentLevel: number,
  hasPrerequisite: boolean,
): {
  transition:
    | LearningSessionTransition.DEMOTED
    | LearningSessionTransition.PREREQUISITE
    | LearningSessionTransition.REINFORCE;
  nextLevel: number | null;
} {
  const previous = previousCoordinate(currentLevel);
  if (previous) {
    return {
      transition: LearningSessionTransition.DEMOTED,
      nextLevel: previous.level,
    };
  }
  return hasPrerequisite
    ? { transition: LearningSessionTransition.PREREQUISITE, nextLevel: null }
    : { transition: LearningSessionTransition.REINFORCE, nextLevel: 1 };
}
