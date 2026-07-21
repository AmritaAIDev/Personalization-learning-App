import {
  describeLearningStage,
  describeSavedPlacement,
  inferInitialPlacement,
} from './placement-engine';

describe('placement engine', () => {
  it('keeps a new learner at the baseline when evidence is missing', () => {
    expect(
      inferInitialPlacement('Electric Field', {
        sameChapterAnswered: 0,
        sameChapterCorrect: 0,
        sameChapterMastered: 0,
        sameSubjectAnswered: 0,
        sameSubjectCorrect: 0,
        sameSubjectMastered: 0,
        masteredPrerequisites: 0,
        averagePeerLevel: 0,
      }),
    ).toMatchObject({
      level: 1,
      reason: 'BASELINE',
      confidence: 'LOW',
      stageLabel: 'Foundation check',
    });
  });

  it('raises the starting point when chapter evidence is strong', () => {
    expect(
      inferInitialPlacement('Electric Field', {
        sameChapterAnswered: 18,
        sameChapterCorrect: 15,
        sameChapterMastered: 1,
        sameSubjectAnswered: 40,
        sameSubjectCorrect: 32,
        sameSubjectMastered: 3,
        masteredPrerequisites: 1,
        averagePeerLevel: 8,
      }),
    ).toMatchObject({
      level: 11,
      reason: 'CHAPTER_EVIDENCE',
      confidence: 'HIGH',
    });
  });

  it('describes saved progress as a resume state', () => {
    expect(describeSavedPlacement(7, 'Electric Field')).toMatchObject({
      level: 7,
      reason: 'RESUME_TOPIC',
      confidence: 'HIGH',
      stageLabel: 'Applied practice',
    });
  });

  it('maps later levels to a mastery stretch stage', () => {
    expect(describeLearningStage(14)).toEqual(
      expect.objectContaining({
        stageLabel: 'Mastery stretch',
      }),
    );
  });
});
