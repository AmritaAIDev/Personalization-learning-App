import {
  LEARNING_COORDINATES,
  LEARNING_LEVEL_COUNT,
  coordinateForLevel,
  nextCoordinate,
  previousCoordinate,
} from './adaptive.types';

describe('adaptive coordinate matrix', () => {
  it('implements five Bloom levels inside each of the three difficulty tiers', () => {
    expect(LEARNING_LEVEL_COUNT).toBe(15);
    expect(LEARNING_COORDINATES.map((coordinate) => coordinate.label)).toEqual([
      'Level 1: Remember · Easy',
      'Level 2: Understand · Easy',
      'Level 3: Apply · Easy',
      'Level 4: Analyze · Easy',
      'Level 5: Evaluate · Easy',
      'Level 6: Remember · Medium',
      'Level 7: Understand · Medium',
      'Level 8: Apply · Medium',
      'Level 9: Analyze · Medium',
      'Level 10: Evaluate · Medium',
      'Level 11: Remember · Hard',
      'Level 12: Understand · Hard',
      'Level 13: Apply · Hard',
      'Level 14: Analyze · Hard',
      'Level 15: Evaluate · Hard',
    ]);
  });

  it('uses explicit floor and ceiling boundaries', () => {
    expect(previousCoordinate(1)).toBeNull();
    expect(nextCoordinate(15)).toBeNull();
    expect(nextCoordinate(5)).toMatchObject({
      level: 6,
      bloomLevel: 'Remember',
      difficulty: 'Medium',
    });
    expect(previousCoordinate(6)).toMatchObject({
      level: 5,
      bloomLevel: 'Evaluate',
      difficulty: 'Easy',
    });
    expect(() => coordinateForLevel(0)).toThrow(RangeError);
    expect(() => coordinateForLevel(16)).toThrow(RangeError);
  });
});
