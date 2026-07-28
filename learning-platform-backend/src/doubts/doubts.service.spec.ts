import { ServiceUnavailableException } from '@nestjs/common';
import { TutorMessageType } from '../adaptive/adaptive.types';
import { Doubt, DoubtStatus } from './doubt.entity';
import { DoubtsService } from './doubts.service';

function makeDoubt(overrides: Partial<Doubt> = {}): Doubt {
  return {
    id: 'doubt-1',
    userId: 'user-1',
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic: 'Gauss Law',
    message: 'Why is the field constant on a spherical Gaussian surface?',
    questionId: null,
    learningSessionId: null,
    learningSessionItemId: null,
    practiceAttemptId: null,
    notebookCardId: null,
    assistantResponse: null,
    status: DoubtStatus.OPEN,
    answeredAt: null,
    createdAt: new Date('2026-07-20T10:00:00.000Z'),
    updatedAt: new Date('2026-07-20T10:00:00.000Z'),
    ...overrides,
  } as Doubt;
}

describe('DoubtsService', () => {
  it('saves a doubt and stores the tutor response when AI succeeds', async () => {
    const created = makeDoubt();
    const repository = {
      create: jest.fn(() => created),
      save: jest
        .fn()
        .mockImplementation((doubt: Doubt) => Promise.resolve({ ...doubt })),
      find: jest.fn(),
    };
    const agentService = {
      generateTutorResponse: jest
        .fn()
        .mockResolvedValue('### Hint\nUse symmetry.'),
    };
    const service = new DoubtsService(
      repository as never,
      agentService as never,
    );

    const result = await service.create('user-1', {
      subject: ' Physics ',
      chapter: ' Electrostatics ',
      topic: ' Gauss Law ',
      message: ' Why is symmetry needed? ',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
        message: 'Why is symmetry needed?',
      }),
    );
    expect(agentService.generateTutorResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: TutorMessageType.GENERAL,
        answerRevealed: false,
      }),
    );
    expect(result).toMatchObject({
      status: DoubtStatus.ANSWERED,
      assistantResponse: '### Hint\nUse symmetry.',
    });
  });

  it('keeps a saved doubt open when tutor generation is unavailable', async () => {
    const created = makeDoubt();
    const repository = {
      create: jest.fn(() => created),
      save: jest.fn().mockResolvedValue(created),
      find: jest.fn(),
    };
    const agentService = {
      generateTutorResponse: jest
        .fn()
        .mockRejectedValue(new ServiceUnavailableException('LLM unavailable')),
    };
    const service = new DoubtsService(
      repository as never,
      agentService as never,
    );

    const result = await service.create('user-1', {
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      message: 'Why does flux depend on enclosed charge?',
    });

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: DoubtStatus.OPEN,
      assistantResponse: null,
    });
  });

  it('lists doubt history with summary counts and recent topics', async () => {
    const repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([
        makeDoubt({ status: DoubtStatus.OPEN }),
        makeDoubt({
          id: 'doubt-2',
          status: DoubtStatus.ANSWERED,
          topic: 'Electric Flux',
          assistantResponse: 'Stored answer',
          answeredAt: new Date('2026-07-21T10:00:00.000Z'),
        }),
      ]),
    };
    const service = new DoubtsService(repository as never, {} as never);

    const result = await service.list('user-1');

    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { createdAt: 'DESC' },
      take: 30,
    });
    expect(result.summary).toMatchObject({ open: 1, answered: 1 });
    expect(result.summary.recentTopics).toContain(
      'Physics • Electrostatics • Gauss Law',
    );
  });
});
