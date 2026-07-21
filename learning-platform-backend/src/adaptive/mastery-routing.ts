import {
  LEARNING_QUESTIONS_PER_SESSION,
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

export function resolveCoordinateCompletion(
  currentLevel: number,
  streakCounter: number,
): CompletionDecision {
  if (streakCounter < LEARNING_QUESTIONS_PER_SESSION) {
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
