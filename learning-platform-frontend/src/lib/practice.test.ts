import { describe, expect, it, vi } from 'vitest';
import {
  elapsedPracticeSeconds,
  practiceHref,
  practiceScopeFromSearchParams,
} from './practice';

describe('practice URL helpers', () => {
  it('accepts a complete scope and generates a safe practice URL', () => {
    const scope = practiceScopeFromSearchParams(
      new URLSearchParams({
        subject: 'Physics',
        chapter: "Coulomb's Law and Charge",
        topic: 'Coulomb law',
      }),
    );

    expect(scope).toEqual({
      subject: 'Physics',
      chapter: "Coulomb's Law and Charge",
      topic: 'Coulomb law',
    });
    expect(practiceHref(scope!)).toContain('chapter=Coulomb%27s+Law+and+Charge');
  });

  it('does not create a practice session from an incomplete scope', () => {
    expect(
      practiceScopeFromSearchParams(new URLSearchParams({ subject: 'Physics' })),
    ).toBeNull();
  });

  it('bounds client-reported elapsed time before sending it to the API', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-07-20T10:30:00Z').getTime());
    expect(elapsedPracticeSeconds('2026-07-20T10:29:20Z')).toBe(40);
    expect(elapsedPracticeSeconds('invalid')).toBe(0);
    vi.restoreAllMocks();
  });
});
