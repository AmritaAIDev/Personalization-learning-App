import { describe, expect, it } from 'vitest';
import { learningTabFromSearchParams, learningUrl } from './learning';

describe('learning helpers', () => {
  it('builds a learning url with an optional workspace tab', () => {
    expect(
      learningUrl(
        {
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: 'Electric Field',
        },
        { tab: 'practice' },
      ),
    ).toBe(
      '/learn?subject=Physics&chapter=Electrostatics&topic=Electric+Field&tab=practice',
    );
  });

  it('keeps an invalid tab query at the overview baseline', () => {
    const bad = new URLSearchParams('tab=matrix');
    const good = new URLSearchParams('tab=review');
    expect(learningTabFromSearchParams(bad as never)).toBe('overview');
    expect(learningTabFromSearchParams(good as never)).toBe('review');
  });
});
