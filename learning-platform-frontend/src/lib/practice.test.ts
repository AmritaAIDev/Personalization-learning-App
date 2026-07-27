import { describe, expect, it } from 'vitest';
import { practiceHref, practiceScopeFromSearchParams } from './practice';

describe('practice route helpers', () => {
  it('builds practice workspace URLs with encoded topic scope', () => {
    expect(
      practiceHref({
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
      }),
    ).toBe('/practice?subject=Physics&chapter=Electrostatics&topic=Gauss+Law');
  });

  it('accepts only complete practice scopes from search params', () => {
    expect(
      practiceScopeFromSearchParams(
        new URLSearchParams('subject=Physics&chapter=Electrostatics&topic=Gauss+Law'),
      ),
    ).toEqual({
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
    });

    expect(practiceScopeFromSearchParams(new URLSearchParams('subject=Physics'))).toBeNull();
  });
});
