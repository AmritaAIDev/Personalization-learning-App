import { COMPASS_PHYSICS_CH1_QUESTIONS } from './content/compass-questions';
import type { CompassQuestion } from './content/compass-question.types';
import {
  COMPASS_QUESTION_TARGET,
  IMPORT_REVIEW_NOTE,
  placeCorrectAt,
  planCompassQuestions,
  summarizePlan,
} from './compass-questions.plan';

function question(overrides: Partial<CompassQuestion> = {}): CompassQuestion {
  return {
    id: 'q1',
    topic: "Coulomb's Law",
    bloomLevel: 'Apply',
    difficulty: 'Medium',
    question: 'What happens to the force when the distance doubles?',
    options: [
      'It becomes a quarter',
      'It doubles',
      'It halves',
      'It is unchanged',
    ],
    correctIndex: 0,
    explanation: 'Force varies as 1/r^2, so doubling r divides F by four.',
    ...overrides,
  };
}

describe('placeCorrectAt', () => {
  it('puts the correct option at the requested position, keeping distractor order', () => {
    const options = ['C', 'x', 'y', 'z'];
    expect(placeCorrectAt(options, 0, 0)).toEqual(['C', 'x', 'y', 'z']);
    expect(placeCorrectAt(options, 0, 1)).toEqual(['x', 'C', 'y', 'z']);
    expect(placeCorrectAt(options, 0, 3)).toEqual(['x', 'y', 'z', 'C']);
  });

  it('works when the correct option is not first', () => {
    expect(placeCorrectAt(['a', 'C', 'b', 'c'], 1, 2)).toEqual([
      'a',
      'b',
      'C',
      'c',
    ]);
  });
});

describe('planCompassQuestions', () => {
  it('builds a DRAFT-ready row with the review note and a matching answer key', () => {
    const { rows, skipped } = planCompassQuestions([question()]);
    expect(skipped).toEqual([]);
    expect(rows[0]).toMatchObject({
      question_id: 'CMP-PHY-CH1-Q1',
      subject: COMPASS_QUESTION_TARGET.subject,
      chapter: COMPASS_QUESTION_TARGET.chapter,
      topic: "Coulomb's Law",
      correct_answer: 'It becomes a quarter',
      bloom_level: 'Apply',
      difficulty: 'Medium',
      marks: 4,
      estimated_time_sec: 90,
      concept_tags: ["Coulomb's Law"],
      review_notes: IMPORT_REVIEW_NOTE,
    });
    expect(rows[0].options).toContain(rows[0].correct_answer);
  });

  it('skips unusable questions with a reason instead of repairing them', () => {
    const { rows, skipped } = planCompassQuestions([
      question({ id: 'dup', options: ['A', 'a', 'B', 'C'] }),
      question({ id: 'three', options: ['A', 'B', 'C'] }),
      question({ id: 'blank', options: ['A', ' ', 'B', 'C'] }),
      question({ id: 'range', correctIndex: 7 }),
      question({ id: 'short', question: 'Too short?' }),
      question({ id: 'noexp', explanation: '  ' }),
      question({ id: 'ok' }),
      question({ id: 'ok' }),
    ]);
    expect(rows.map((r) => r.question_id)).toEqual(['CMP-PHY-CH1-OK']);
    expect(
      Object.fromEntries(skipped.map((s) => [s.id, s.reason])),
    ).toMatchObject({
      dup: 'has duplicate options',
      three: 'has 3 options, expected 4',
      blank: 'has an empty option',
      range: 'has an out-of-range answer index',
      short: 'question text is too short',
      noexp: 'has no explanation',
    });
    expect(skipped.filter((s) => s.id === 'ok')).toEqual([
      { id: 'ok', reason: 'duplicate id' },
    ]);
  });

  it('balances the answer position across accepted questions (not always first)', () => {
    const many = Array.from({ length: 8 }, (_, index) =>
      question({ id: `q${index}` }),
    );
    const { rows } = planCompassQuestions(many);
    expect(rows.map((r) => r.answerPosition)).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
    for (const row of rows) {
      expect(row.options[row.answerPosition]).toBe(row.correct_answer);
    }
  });

  it('is deterministic, so re-running the import is idempotent', () => {
    const first = planCompassQuestions(COMPASS_PHYSICS_CH1_QUESTIONS);
    const second = planCompassQuestions(COMPASS_PHYSICS_CH1_QUESTIONS);
    expect(second).toEqual(first);
  });
});

describe('the reviewed Compass Physics Chapter 1 data', () => {
  const plan = planCompassQuestions(COMPASS_PHYSICS_CH1_QUESTIONS);

  it('imports all but the two questions with duplicate options', () => {
    expect(COMPASS_PHYSICS_CH1_QUESTIONS).toHaveLength(120);
    expect(plan.skipped).toHaveLength(2);
    expect(
      plan.skipped.every((s) => s.reason === 'has duplicate options'),
    ).toBe(true);
    expect(plan.rows).toHaveLength(118);
  });

  it('keeps ids unique and every answer key inside its options', () => {
    expect(new Set(plan.rows.map((r) => r.question_id)).size).toBe(118);
    for (const row of plan.rows) {
      expect(row.options).toHaveLength(4);
      expect(row.options).toContain(row.correct_answer);
      expect(row.question_id).toMatch(/^CMP-PHY-CH1-[A-Z0-9_]+$/);
    }
  });

  it('no longer lets a student pass by always choosing the first option', () => {
    const summary = summarizePlan(plan.rows);
    expect(summary.byAnswerPosition.reduce((a, b) => a + b, 0)).toBe(118);
    // within one of an even split across the four positions
    for (const count of summary.byAnswerPosition) {
      expect(Math.abs(count - 118 / 4)).toBeLessThanOrEqual(1);
    }
  });

  it('covers the four Bloom levels and three difficulties of the source', () => {
    const summary = summarizePlan(plan.rows);
    expect(Object.keys(summary.byBloom).sort()).toEqual([
      'Analyze',
      'Apply',
      'Evaluate',
      'Understand',
    ]);
    expect(Object.keys(summary.byDifficulty).sort()).toEqual([
      'Easy',
      'Hard',
      'Medium',
    ]);
    expect(Object.keys(summary.byTopic)).toHaveLength(10);
  });

  it('has quality scores in the valid range', () => {
    for (const row of plan.rows) {
      expect(row.quality_score).toBeGreaterThanOrEqual(65);
      expect(row.quality_score).toBeLessThanOrEqual(100);
    }
  });
});
