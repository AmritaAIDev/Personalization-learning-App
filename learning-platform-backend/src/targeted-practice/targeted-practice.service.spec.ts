import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TargetedPracticeService } from './targeted-practice.service';
import { TargetedPracticeQuestion } from './targeted-practice-question.entity';
import { GenerateTargetedQuestionDto } from './targeted-practice.dto';

function makeGoodGeneratedQuestion(overrides: Record<string, unknown> = {}) {
  return {
    question_text: 'A long enough question prompt about Gauss law flux.',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_answer: 'Option B',
    explanation: 'A sufficiently detailed explanation of the reasoning path.',
    hint: 'Think about symmetry.',
    concept_tags: ['flux'],
    common_errors: ['Confusing flux with field magnitude.'],
    ...overrides,
  };
}

const baseInput: GenerateTargetedQuestionDto = {
  subject: 'Physics',
  chapter: 'Electrostatics',
  topic: 'Gauss Law',
  reason: 'MISCONCEPTION',
  focusText: 'Confusing flux with electric field magnitude.',
};

describe('TargetedPracticeService', () => {
  function makeRepository(existing: TargetedPracticeQuestion | null = null) {
    return {
      findOne: jest.fn().mockResolvedValue(existing),
      create: jest.fn(
        (entity: Partial<TargetedPracticeQuestion>) =>
          entity as TargetedPracticeQuestion,
      ),
      save: jest.fn((entity: TargetedPracticeQuestion) =>
        Promise.resolve({
          ...entity,
          id: entity.id ?? 'question-1',
          createdAt: entity.createdAt ?? new Date(),
        }),
      ),
    };
  }

  function makeContentService() {
    return {
      buildSourceMaterial: jest.fn().mockResolvedValue('Reviewed material.'),
    };
  }

  it('generates and persists a new question, threading a misconception focus hint', async () => {
    const repository = makeRepository();
    const contentService = makeContentService();
    const agentService = {
      generateLearningQuestionBatch: jest
        .fn()
        .mockResolvedValue([makeGoodGeneratedQuestion()]),
    };
    const service = new TargetedPracticeService(
      repository as never,
      agentService as never,
      contentService as never,
    );

    const result = await service.generate('user-1', baseInput);

    expect(contentService.buildSourceMaterial).toHaveBeenCalledWith({
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
    });
    const [request] = agentService.generateLearningQuestionBatch.mock.calls[0];
    expect(request.focusHint).toContain(baseInput.focusText);
    expect(result).not.toHaveProperty('correctAnswer');
    expect(result.questionText).toBe(
      'A long enough question prompt about Gauss law flux.',
    );
  });

  it('threads an isomorphic-question focus hint for the SIMILAR reason', async () => {
    const repository = makeRepository();
    const contentService = makeContentService();
    const agentService = {
      generateLearningQuestionBatch: jest
        .fn()
        .mockResolvedValue([makeGoodGeneratedQuestion()]),
    };
    const service = new TargetedPracticeService(
      repository as never,
      agentService as never,
      contentService as never,
    );
    const sourceQuestionText = 'A capacitor question about plate separation.';

    await service.generate('user-1', {
      ...baseInput,
      reason: 'SIMILAR',
      focusText: sourceQuestionText,
      sourceQuestionId: 'question-source-1',
      bloomLevel: 'Apply',
      difficulty: 'Hard',
    });

    const [request] = agentService.generateLearningQuestionBatch.mock.calls[0];
    expect(request.focusHint.toLowerCase()).toContain('isomorphic');
    expect(request.focusHint).toContain(sourceQuestionText);
    expect(request.bloomLevel).toBe('Application');
    expect(request.difficulty).toBe('Hard');
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'SIMILAR',
        sourceQuestionId: 'question-source-1',
      }),
    );
  });

  it('reuses a recent unanswered question instead of generating again', async () => {
    const cached: TargetedPracticeQuestion = {
      id: 'cached-1',
      userId: 'user-1',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      reason: 'MISCONCEPTION',
      focusText: baseInput.focusText,
      focusHash: 'hash',
      sourceQuestionId: null,
      questionText: 'Cached question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      solution: 'Cached solution',
      hint: 'Cached hint',
      conceptTags: [],
      bloomLevel: 'Application',
      difficulty: 'Medium',
      selectedOption: null,
      isCorrect: null,
      answeredAt: null,
      createdAt: new Date(),
    };
    const repository = makeRepository(cached);
    const contentService = makeContentService();
    const agentService = { generateLearningQuestionBatch: jest.fn() };
    const service = new TargetedPracticeService(
      repository as never,
      agentService as never,
      contentService as never,
    );

    const result = await service.generate('user-1', baseInput);

    expect(agentService.generateLearningQuestionBatch).not.toHaveBeenCalled();
    expect(result.id).toBe('cached-1');
  });

  it('rejects a low-quality generation instead of serving it', async () => {
    const repository = makeRepository();
    const contentService = makeContentService();
    const agentService = {
      generateLearningQuestionBatch: jest.fn().mockResolvedValue([
        makeGoodGeneratedQuestion({
          options: ['Option A', 'Option A', 'Option A', 'Option A'],
          explanation: 'short',
        }),
      ]),
    };
    const service = new TargetedPracticeService(
      repository as never,
      agentService as never,
      contentService as never,
    );

    await expect(service.generate('user-1', baseInput)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('grades a submitted answer and marks it answered', async () => {
    const question: TargetedPracticeQuestion = {
      id: 'question-1',
      userId: 'user-1',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      reason: 'MISCONCEPTION',
      focusText: 'Confusing flux.',
      focusHash: 'hash',
      sourceQuestionId: null,
      questionText: 'Question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'B',
      solution: 'Because symmetry.',
      hint: 'Hint',
      conceptTags: [],
      bloomLevel: 'Application',
      difficulty: 'Medium',
      selectedOption: null,
      isCorrect: null,
      answeredAt: null,
      createdAt: new Date(),
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue(question),
      save: jest.fn((entity: TargetedPracticeQuestion) =>
        Promise.resolve(entity),
      ),
    };
    const service = new TargetedPracticeService(
      repository as never,
      {} as never,
      {} as never,
    );

    const result = await service.submitAnswer('user-1', 'question-1', 'B');

    expect(result).toEqual({
      isCorrect: true,
      correctAnswer: 'B',
      solution: 'Because symmetry.',
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ selectedOption: 'B', isCorrect: true }),
    );
  });

  it('rejects answering the same question twice', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'question-1',
        options: ['A', 'B'],
        answeredAt: new Date(),
      }),
      save: jest.fn(),
    };
    const service = new TargetedPracticeService(
      repository as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.submitAnswer('user-1', 'question-1', 'A'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an option that is not one of the question choices', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'question-1',
        options: ['A', 'B'],
        answeredAt: null,
      }),
      save: jest.fn(),
    };
    const service = new TargetedPracticeService(
      repository as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.submitAnswer('user-1', 'question-1', 'Z'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
