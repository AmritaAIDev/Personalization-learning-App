import {
  LEARNING_COORDINATES,
  LEARNING_LEVEL_COUNT,
  coordinateForLevel,
  nextCoordinate,
  previousCoordinate,
} from './adaptive.types';

describe('adaptive coordinate matrix', () => {
  it('implements four proficiency levels across three difficulty tiers (Easy→Medium→Hard within each)', () => {
    expect(LEARNING_LEVEL_COUNT).toBe(12);
    expect(LEARNING_COORDINATES.map((coordinate) => coordinate.label)).toEqual([
      'Level 1: Recall · Easy',
      'Level 2: Recall · Medium',
      'Level 3: Recall · Hard',
      'Level 4: Comprehension · Easy',
      'Level 5: Comprehension · Medium',
      'Level 6: Comprehension · Hard',
      'Level 7: Application · Easy',
      'Level 8: Application · Medium',
      'Level 9: Application · Hard',
      'Level 10: Higher-Order · Easy',
      'Level 11: Higher-Order · Medium',
      'Level 12: Higher-Order · Hard',
    ]);
  });

  it('uses explicit floor and ceiling boundaries', () => {
    expect(previousCoordinate(1)).toBeNull();
    expect(nextCoordinate(12)).toBeNull();
    expect(nextCoordinate(3)).toMatchObject({
      level: 4,
      bloomLevel: 'Comprehension',
      difficulty: 'Easy',
    });
    expect(previousCoordinate(4)).toMatchObject({
      level: 3,
      bloomLevel: 'Recall',
      difficulty: 'Hard',
    });
  });

  it('clamps out-of-range levels instead of throwing (resilient to legacy state)', () => {
    expect(coordinateForLevel(0).level).toBe(1);
    expect(coordinateForLevel(99).level).toBe(LEARNING_LEVEL_COUNT);
  });
});
