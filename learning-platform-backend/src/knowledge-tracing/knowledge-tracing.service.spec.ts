import { KnowledgeTracingService } from './knowledge-tracing.service';

/** A graded answer row exactly as loadAnswerEvents' SQL returns it. */
function eventRow(
  topic: string,
  correct: boolean,
  minutes: number,
  chapter = 'Electrostatics',
) {
  return {
    subject: 'Physics',
    chapter,
    topic,
    bloom: null,
    is_correct: correct,
    answered_at: new Date(Date.UTC(2026, 9, 1, 0, minutes)).toISOString(),
  };
}

function makeService(rows: ReturnType<typeof eventRow>[]) {
  const masteryRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((row: unknown) => row),
    save: jest.fn((row: unknown) => Promise.resolve(row)),
  };
  const dataSource = { query: jest.fn().mockResolvedValue(rows) };
  const service = new KnowledgeTracingService(
    masteryRepository as never,
    dataSource as never,
  );
  return { service, masteryRepository, dataSource };
}

describe('KnowledgeTracingService', () => {
  it('traces each skill independently and assigns bands', async () => {
    const { service } = makeService([
      ...Array.from({ length: 5 }, (_, m) => eventRow('Gauss Law', true, m)),
      eventRow('Electric Flux', false, 10),
    ]);

    const views = await service.masteryFor('user-1');
    const gauss = views.find((v) => v.topic === 'Gauss Law');
    const flux = views.find((v) => v.topic === 'Electric Flux');

    expect(gauss?.band).toBe('mastered');
    expect(gauss?.attempts).toBe(5);
    expect(gauss?.correct).toBe(5);
    expect(flux?.band).toBe('weak');
    expect(flux?.confidence).toBe('low'); // single observation
  });

  it('caps history at the most recent observations so recency dominates', async () => {
    const early = Array.from({ length: 10 }, (_, m) =>
      eventRow('Gauss Law', true, m),
    );
    const recent = Array.from({ length: 50 }, (_, m) =>
      eventRow('Gauss Law', false, 100 + m),
    );
    const { service } = makeService([...early, ...recent]);

    const [gauss] = await service.masteryFor('user-1');
    expect(gauss.attempts).toBe(50);
    expect(gauss.correct).toBe(0); // the 10 older correct answers fell out of the window
    expect(gauss.band).toBe('weak');
  });

  it('lists weak skills weakest-first, skipping single-observation noise', async () => {
    const { service } = makeService([
      eventRow('One Mistake', false, 1), // attempts=1 → excluded as noise
      eventRow('Capacitance', false, 10),
      eventRow('Capacitance', false, 11),
      eventRow('Gauss Law', true, 20),
      eventRow('Gauss Law', true, 21),
      eventRow('Flux', false, 30),
      eventRow('Flux', true, 31),
    ]);

    const weak = await service.weakSkills('user-1', null, 5);
    const topics = weak.map((v) => v.topic);
    expect(topics).toContain('Capacitance');
    expect(topics).not.toContain('One Mistake');
    expect(topics).not.toContain('Gauss Law');
    expect(topics[0]).toBe('Capacitance'); // weakest first
  });

  it('summarises band counts for the progress strip', async () => {
    const { service } = makeService([
      ...Array.from({ length: 5 }, (_, m) => eventRow('Gauss Law', true, m)),
      eventRow('Flux', false, 10),
      eventRow('Flux', false, 11),
    ]);

    const summary = await service.summary('user-1');
    expect(summary).toEqual({
      mastered: 1,
      developing: 0,
      weak: 1,
      tracked: 2,
    });
  });

  it('passes the subject filter through to the events query', async () => {
    const { service, dataSource } = makeService([]);
    await service.masteryFor('user-1', 'Physics');
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['user-1', 'Physics']),
    );
  });
});
