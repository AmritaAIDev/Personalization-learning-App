import { MisconceptionsService } from './misconceptions.service';
import { MisconceptionHit } from './misconception-hit.entity';

function makeContext(
  overrides: Partial<
    Parameters<MisconceptionsService['recordFromWrongAnswer']>[0]
  > = {},
) {
  return {
    userId: 'user-1',
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic: 'Gauss Law',
    questionId: 'question-1',
    questionText: 'What does electric flux measure?',
    options: ['A', 'B', 'C', 'D'],
    selectedOption: 'A',
    correctAnswer: 'B',
    commonErrors: ['Confusing flux with electric field magnitude.'],
    source: 'PRACTICE' as const,
    ...overrides,
  };
}

describe('MisconceptionsService', () => {
  function makeRepository(existing: MisconceptionHit | null = null) {
    return {
      findOne: jest.fn().mockResolvedValue(existing),
      create: jest.fn(
        (entity: Partial<MisconceptionHit>) => entity as MisconceptionHit,
      ),
      save: jest.fn((entity: MisconceptionHit) => Promise.resolve(entity)),
    };
  }

  it('records a single common_errors candidate without calling the model', async () => {
    const repository = makeRepository();
    const agentService = { classifyMisconception: jest.fn() };
    const service = new MisconceptionsService(
      repository as never,
      agentService as never,
    );

    await service.recordFromWrongAnswer(makeContext());

    expect(agentService.classifyMisconception).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        misconception: 'Confusing flux with electric field magnitude.',
        hitCount: 1,
        source: 'PRACTICE',
      }),
    );
  });

  it('asks the model to pick among multiple candidates', async () => {
    const repository = makeRepository();
    const agentService = {
      classifyMisconception: jest.fn().mockResolvedValue(1),
    };
    const service = new MisconceptionsService(
      repository as never,
      agentService as never,
    );

    await service.recordFromWrongAnswer(
      makeContext({
        commonErrors: ['Wrong direction.', 'Wrong magnitude formula.'],
      }),
    );

    expect(agentService.classifyMisconception).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ misconception: 'Wrong magnitude formula.' }),
    );
  });

  it('falls back to a stable deterministic pick when classification fails', async () => {
    const repository = makeRepository();
    const agentService = {
      classifyMisconception: jest.fn().mockRejectedValue(new Error('down')),
    };
    const service = new MisconceptionsService(
      repository as never,
      agentService as never,
    );
    const context = makeContext({
      commonErrors: ['Wrong direction.', 'Wrong magnitude formula.'],
    });

    await service.recordFromWrongAnswer(context);
    await service.recordFromWrongAnswer(context);

    const savedMisconceptions = repository.save.mock.calls.map(
      ([entity]: [Partial<MisconceptionHit>]) => entity.misconception,
    );
    expect(savedMisconceptions[0]).toBe(savedMisconceptions[1]);
  });

  it('increments the hit count for an existing misconception', async () => {
    const existing: MisconceptionHit = {
      id: 'hit-1',
      userId: 'user-1',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      misconception: 'Confusing flux with electric field magnitude.',
      misconceptionHash: 'hash',
      hitCount: 2,
      source: 'PRACTICE',
      lastQuestionId: 'question-0',
      firstOccurredAt: new Date('2026-01-01'),
      lastOccurredAt: new Date('2026-01-01'),
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };
    const repository = makeRepository(existing);
    const agentService = { classifyMisconception: jest.fn() };
    const service = new MisconceptionsService(
      repository as never,
      agentService as never,
    );

    await service.recordFromWrongAnswer(makeContext());

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hit-1', hitCount: 3 }),
    );
  });

  it('never throws when classification and persistence both fail', async () => {
    const repository = {
      findOne: jest.fn().mockRejectedValue(new Error('db down')),
      create: jest.fn(),
      save: jest.fn(),
    };
    const agentService = { classifyMisconception: jest.fn() };
    const service = new MisconceptionsService(
      repository as never,
      agentService as never,
    );

    await expect(
      service.recordFromWrongAnswer(makeContext()),
    ).resolves.toBeUndefined();
  });

  it('returns the highest-count misconception per topic in a batch lookup', async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([
        {
          subject: 'Physics',
          topic: 'Gauss Law',
          misconception: 'Minor slip.',
          hitCount: 1,
        },
        {
          subject: 'Physics',
          topic: 'Gauss Law',
          misconception: 'Repeated core gap.',
          hitCount: 4,
        },
      ]),
    };
    const service = new MisconceptionsService(repository as never, {} as never);

    const result = await service.getDominantByTopic('user-1', [
      { subject: 'Physics', topic: 'Gauss Law' },
    ]);

    expect(result.get('Physics|Gauss Law')).toEqual({
      text: 'Repeated core gap.',
      count: 4,
    });
  });
});
