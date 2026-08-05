import { calibrationFor } from './confidence.util';

describe('calibrationFor', () => {
  it('returns null when no confidence was captured', () => {
    expect(calibrationFor(null, true)).toBeNull();
    expect(calibrationFor(undefined, false)).toBeNull();
  });

  it('flags a confident but wrong answer as overconfident', () => {
    expect(calibrationFor(3, false)).toBe('overconfident');
  });

  it('flags an unsure but correct answer as underconfident', () => {
    expect(calibrationFor(1, true)).toBe('underconfident');
  });

  it('treats aligned outcomes as calibrated', () => {
    expect(calibrationFor(3, true)).toBe('calibrated');
    expect(calibrationFor(1, false)).toBe('calibrated');
    expect(calibrationFor(2, true)).toBe('calibrated');
    expect(calibrationFor(2, false)).toBe('calibrated');
  });
});
