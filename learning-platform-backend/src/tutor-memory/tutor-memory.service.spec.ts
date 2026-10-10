import { TutorMemoryService } from './tutor-memory.service';

function event(topic: string, correct: boolean, minutesAgo: number) {
  return {
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic,
    bloom: null,
    is_correct: correct,
    answered_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  };
}

function makeService(
  rows: ReturnType<typeof event>[],
  tracing: {
    summary?: jest.Mock;
    weakSkills?: jest.Mock;
  } = {},
) {
  const dataSource = { query: jest.fn().mockResolvedValue(rows) };
  const tracingService = {
    summary:
      tracing.summary ??
      jest.fn().mockResolvedValue({
        mastered: 3,
        developing: 2,
        weak: 4,
        tracked: 9,
      }),
    weakSkills:
      tracing.weakSkills ??
      jest.fn().mockResolvedValue([
        {
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: 'Capacitance',
          pKnow: 0.17,
          attempts: 2,
          correct: 0,
          band: 'weak',
          confidence: 'low',
          lastTracedAt: null,
        },
      ]),
  };
  const service = new TutorMemoryService(
    dataSource as never,
    tracingService as never,
  );
  return { service, tracingService };
}

describe('TutorMemoryService', () => {
  it('assembles mastery counts, weak skills and recent misses', async () => {
    const { service } = makeService([
      event('Gauss Law', false, 120), // 2h ago
      event('Gauss Law', false, 60), // duplicate topic -> shown once
      event('Electric Field', true, 30),
    ]);

    const memory = await service.buildLearnerMemory('user-1');
    expect(memory).toContain(
      'Tracked concepts: 3 mastered, 2 developing, 4 weak.',
    );
    expect(memory).toContain('Capacitance (mastery 17%, 2 attempts)');
    expect(memory).toContain('Recent misses: Gauss Law (1h ago)'); // newest miss wins
    expect(memory?.match(/Gauss Law/g)?.length).toBe(1); // deduped
  });

  it('returns null when every source is empty', async () => {
    const { service } = makeService([], {
      summary: jest.fn().mockResolvedValue({
        mastered: 0,
        developing: 0,
        weak: 0,
        tracked: 0,
      }),
      weakSkills: jest.fn().mockResolvedValue([]),
    });
    expect(await service.buildLearnerMemory('user-1')).toBeNull();
  });

  it('caps the block length', async () => {
    const manyWeak = Array.from({ length: 4 }, (_, i) => ({
      subject: 'Physics',
      chapter: 'C',
      topic: `A very long topic name number ${i} that keeps going`,
      pKnow: 0.1,
      attempts: 9,
      correct: 1,
      band: 'weak' as const,
      confidence: 'ok' as const,
      lastTracedAt: null,
    }));
    const { service } = makeService(
      Array.from({ length: 4 }, (_, i) =>
        event(`Miss topic ${i}`, false, 10 + i),
      ),
      {
        summary: jest.fn().mockResolvedValue({
          mastered: 99,
          developing: 99,
          weak: 99,
          tracked: 297,
        }),
        weakSkills: jest.fn().mockResolvedValue(manyWeak),
      },
    );
    const memory = await service.buildLearnerMemory('user-1');
    expect(memory).not.toBeNull();
    expect(memory!.length).toBeLessThanOrEqual(600);
  });

  it('degrades gracefully when a source fails', async () => {
    const { service } = makeService([event('Gauss Law', false, 45)], {
      summary: jest.fn().mockRejectedValue(new Error('db down')),
      weakSkills: jest.fn().mockRejectedValue(new Error('db down')),
    });
    const memory = await service.buildLearnerMemory('user-1');
    expect(memory).toBe('Recent misses: Gauss Law (45m ago).');
  });

  it('contains no identifiers or contact details', async () => {
    const { service } = makeService([event('Gauss Law', false, 10)]);
    const memory = await service.buildLearnerMemory('user-1');
    expect(memory).not.toContain('user-1');
    expect(memory).not.toContain('@');
  });
});
