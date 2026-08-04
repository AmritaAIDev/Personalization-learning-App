import { describe, expect, it } from 'vitest';
import { nextTutorPollDelay, totalTutorPollWindowMs } from './tutor-polling';

describe('tutor reply polling schedule', () => {
  it('checks quickly at first so a fast hint appears immediately', () => {
    expect(nextTutorPollDelay(0)).toBeLessThanOrEqual(700);
  });

  it('backs off instead of holding a fixed rate', () => {
    const first = nextTutorPollDelay(0) ?? 0;
    const later = nextTutorPollDelay(5) ?? 0;
    expect(later).toBeGreaterThan(first);
  });

  it('ends the wait rather than polling forever', () => {
    expect(nextTutorPollDelay(50)).toBeNull();
  });

  it('waits long enough to cover a slow model, but not indefinitely', () => {
    const window = totalTutorPollWindowMs();
    expect(window).toBeGreaterThan(20_000);
    expect(window).toBeLessThan(60_000);
  });
});
