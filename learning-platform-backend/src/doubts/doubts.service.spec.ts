import { ServiceUnavailableException } from '@nestjs/common';
import { TutorMessageType } from '../adaptive/adaptive.types';
import { Doubt, DoubtStatus } from './doubt.entity';
import { DoubtsService } from './doubts.service';

/** Minimal repository stub for the question-context lookups a doubt may make. */
function makeLookupRepo() {
  return { findOne: jest.fn().mockResolvedValue(null) };
}

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
  it('saves a doubt open immediately and resolves the tutor response in the background', async () => {
    const created = makeDoubt();
    const saved: Doubt[] = [];
    const repository = {
      create: jest.fn(() => created),
      save: jest.fn().mockImplementation((doubt: Doubt) => {
        const resolved = { ...doubt };
        saved.push(resolved);
        return Promise.resolve(resolved);
      }),
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(created),
    };
    const agentService = {
      generateTutorResponse: jest
        .fn()
        .mockResolvedValue('### Hint\nUse symmetry.'),
      retrieveSupplementalSources: jest.fn().mockResolvedValue([]),
    };
    const service = new DoubtsService(
      repository as never,
      makeLookupRepo() as never,
      makeLookupRepo() as never,
      makeLookupRepo() as never,
      agentService as never,
    );

    const result = await service.create('user-1', {
      subject: ' Physics ',
      chapter: ' Electrostatics ',
      topic: ' Gauss Law ',
      message: ' Why is symmetry needed? ',
    });

    // The create call returns immediately with the doubt still open.
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
        message: 'Why is symmetry needed?',
      }),
    );
    expect(result).toMatchObject({
      status: DoubtStatus.OPEN,
      assistantResponse: null,
    });

    // Let the fire-and-forget background resolution complete.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(agentService.generateTutorResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: TutorMessageType.GENERAL,
        answerRevealed: false,
      }),
    );
    // The second save flips the doubt to ANSWERED with the tutor response.
    expect(saved.some((d) => d.status === DoubtStatus.ANSWERED)).toBe(true);
  });

  it('anchors the tutor answer to the question a doubt was raised from', async () => {
    const created = makeDoubt({
      learningSessionItemId: 'item-1',
      questionId: null,
    });
    const repository = {
      create: jest.fn(() => created),
      save: jest.fn().mockResolvedValue(created),
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(created),
    };
    const sessionItemsRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'item-1',
        resolvedAt: new Date(),
        question: {
          question_text: 'Flux through a square face?',
          options: ['q/e0', 'q/6e0', '0', 'q/2e0'],
          correct_answer: 'q/6e0',
          solution: 'Use cube symmetry.',
          common_errors: ['Treats an open surface as closed.'],
        },
        generatedQuestion: null,
        answers: [
          {
            selectedOption: 'q/e0',
            createdAt: new Date('2026-07-20T10:00:00Z'),
          },
        ],
      }),
    };
    const agentService = {
      generateTutorResponse: jest.fn().mockResolvedValue('### Answer\n…'),
      retrieveSupplementalSources: jest.fn().mockResolvedValue([]),
    };
    const service = new DoubtsService(
      repository as never,
      sessionItemsRepo as never,
      makeLookupRepo() as never,
      makeLookupRepo() as never,
      agentService as never,
    );

    await service.create('user-1', {
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      message: 'Why not the full q/e0?',
      learningSessionItemId: 'item-1',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(agentService.generateTutorResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        explanatory: true,
        answerRevealed: true,
        questionText: 'Flux through a square face?',
        correctAnswer: 'q/6e0',
        selectedOption: 'q/e0',
      }),
    );
  });

  it('keeps a saved doubt open when tutor generation is unavailable', async () => {
    const created = makeDoubt();
    const repository = {
      create: jest.fn(() => created),
      save: jest.fn().mockResolvedValue(created),
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(created),
    };
    const agentService = {
      generateTutorResponse: jest
        .fn()
        .mockRejectedValue(new ServiceUnavailableException('LLM unavailable')),
      retrieveSupplementalSources: jest.fn().mockResolvedValue([]),
    };
    const service = new DoubtsService(
      repository as never,
      makeLookupRepo() as never,
      makeLookupRepo() as never,
      makeLookupRepo() as never,
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
    const service = new DoubtsService(
      repository as never,
      makeLookupRepo() as never,
      makeLookupRepo() as never,
      makeLookupRepo() as never,
      {} as never,
    );

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
