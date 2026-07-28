import { coordinateForLevel, LEARNING_LEVEL_COUNT } from './adaptive.types';

export type PlacementConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type PlacementReason =
  | 'RESUME_TOPIC'
  | 'CHAPTER_EVIDENCE'
  | 'SUBJECT_EVIDENCE'
  | 'PREREQUISITE_EVIDENCE'
  | 'BASELINE';

export type PlacementEvidence = {
  sameChapterAnswered: number;
  sameChapterCorrect: number;
  sameChapterMastered: number;
  sameSubjectAnswered: number;
  sameSubjectCorrect: number;
  sameSubjectMastered: number;
  masteredPrerequisites: number;
  averagePeerLevel: number;
};

export type PlacementSummary = {
  level: number;
  confidence: PlacementConfidence;
  reason: PlacementReason;
  stageLabel: string;
  summary: string;
  nextFocus: string;
};

export function describeLearningStage(level: number): {
  stageLabel: string;
  nextFocus: string;
  coordinateLabel: string;
} {
  const boundedLevel = Math.min(LEARNING_LEVEL_COUNT, Math.max(1, level));
  const coordinate = coordinateForLevel(boundedLevel);

  if (boundedLevel <= 2) {
    return {
      stageLabel: 'Foundation check',
      nextFocus:
        'Lock in core recall and concept meaning before adding speed or complexity.',
      coordinateLabel: coordinate.label,
    };
  }

  if (boundedLevel <= 5) {
    return {
      stageLabel: 'Concept builder',
      nextFocus:
        'Strengthen understanding so the topic can hold up under standard problem solving.',
      coordinateLabel: coordinate.label,
    };
  }

  if (boundedLevel <= 8) {
    return {
      stageLabel: 'Applied practice',
      nextFocus:
        'Convert understanding into reliable standard-question execution.',
      coordinateLabel: coordinate.label,
    };
  }

  if (boundedLevel <= 11) {
    return {
      stageLabel: 'Reasoning stretch',
      nextFocus:
        'Handle multi-step structure, decision points, and mixed reasoning with fewer hints.',
      coordinateLabel: coordinate.label,
    };
  }

  return {
    stageLabel: 'Mastery stretch',
    nextFocus:
      'Sustain advanced reasoning and finish the topic at an exam-ready standard.',
    coordinateLabel: coordinate.label,
  };
}

export function inferInitialPlacement(
  topic: string,
  evidence: PlacementEvidence,
): PlacementSummary {
  const sameChapterAccuracy =
    evidence.sameChapterAnswered > 0
      ? evidence.sameChapterCorrect / evidence.sameChapterAnswered
      : 0;
  const sameSubjectAccuracy =
    evidence.sameSubjectAnswered > 0
      ? evidence.sameSubjectCorrect / evidence.sameSubjectAnswered
      : 0;

  let readinessScore = 0;
  let reason: PlacementReason = 'BASELINE';
  let confidence: PlacementConfidence = 'LOW';

  if (evidence.masteredPrerequisites > 0) {
    readinessScore += 2;
    reason = 'PREREQUISITE_EVIDENCE';
    confidence = 'MEDIUM';
  }

  if (evidence.sameChapterMastered >= 1) {
    readinessScore += 2;
    reason = 'CHAPTER_EVIDENCE';
    confidence = 'HIGH';
  }

  if (evidence.sameChapterAnswered >= 10 && sameChapterAccuracy >= 0.8) {
    readinessScore += 2;
    reason = 'CHAPTER_EVIDENCE';
    confidence = 'HIGH';
  } else if (evidence.sameChapterAnswered >= 6 && sameChapterAccuracy >= 0.67) {
    readinessScore += 1;
    reason = 'CHAPTER_EVIDENCE';
    confidence = confidence === 'HIGH' ? 'HIGH' : 'MEDIUM';
  }

  if (evidence.sameSubjectAnswered >= 20 && sameSubjectAccuracy >= 0.78) {
    readinessScore += 1;
    if (reason === 'BASELINE') reason = 'SUBJECT_EVIDENCE';
    if (confidence === 'LOW') confidence = 'MEDIUM';
  }

  if (evidence.sameSubjectMastered >= 3) {
    readinessScore += 1;
    if (reason === 'BASELINE') reason = 'SUBJECT_EVIDENCE';
    if (confidence === 'LOW') confidence = 'MEDIUM';
  }

  if (evidence.averagePeerLevel >= 7) {
    readinessScore += 1;
  }

  if (
    evidence.sameChapterAnswered >= 6 &&
    sameChapterAccuracy > 0 &&
    sameChapterAccuracy < 0.55
  ) {
    readinessScore = Math.max(0, readinessScore - 1);
  }

  const level =
    readinessScore >= 6
      ? 11
      : readinessScore === 5
        ? 9
        : readinessScore === 4
          ? 7
          : readinessScore === 3
            ? 5
            : readinessScore === 2
              ? 3
              : 1;

  const stage = describeLearningStage(level);
  const summary =
    reason === 'PREREQUISITE_EVIDENCE'
      ? `You are starting ${topic} above the baseline because you already proved strength in prerequisite work.`
      : reason === 'CHAPTER_EVIDENCE'
        ? `You are starting ${topic} from a stronger checkpoint because your recent chapter performance shows you do not need a cold start.`
        : reason === 'SUBJECT_EVIDENCE'
          ? `You are starting ${topic} from a guided checkpoint based on your broader subject performance.`
          : `You are starting ${topic} from the baseline so the system can measure your understanding cleanly before moving up.`;

  return {
    level,
    confidence,
    reason,
    stageLabel: stage.stageLabel,
    summary,
    nextFocus: stage.nextFocus,
  };
}

export function describeSavedPlacement(
  level: number,
  topic: string,
): PlacementSummary {
  const stage = describeLearningStage(level);
  return {
    level,
    confidence: 'HIGH',
    reason: 'RESUME_TOPIC',
    stageLabel: stage.stageLabel,
    summary: `You are resuming ${topic} from the last saved checkpoint created by your own answer history.`,
    nextFocus: stage.nextFocus,
  };
}
