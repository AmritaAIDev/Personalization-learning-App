import { ConflictException } from '@nestjs/common';
import { QuestionPublicationStatus, QuestionSource } from './question.entity';
import {
  QuestionReportReason,
  QuestionReportStatus,
} from './question-report.entity';
import {
  GeneratedLearningQuestionStatus,
  LearningQuestionSource,
} from './adaptive/adaptive.types';
import { QuestionsService } from './questions.service';

function validQuestionRow(overrides: Record<string, unknown> = {}) {
  return {
    subject: 'Physics',
    chapter: 'Electric Charges and Fields',
    topic: "Coulomb's Law and Charge",
    question_text: 'A hand-typed question long enough for validation.',
    options: ['A', 'B', 'C', 'D'],
    correct_answer: 'B',
    solution: 'A sufficiently detailed worked solution for review.',
    bloom_level: 'Apply',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 90,
    ...overrides,
  };
}

describe('QuestionsService', () => {
  const manager = { count: jest.fn(), query: jest.fn() };
  const questionsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    manager,
  };
  const generatedQuestionsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const questionReportsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  let service: QuestionsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new QuestionsService(
      questionsRepository as never,
      generatedQuestionsRepository as never,
      questionReportsRepository as never,
    );
  });

  it('persists generated content as a draft instead of exposing it to learners', async () => {
    questionsRepository.create.mockImplementation((input) => input);
    questionsRepository.save.mockImplementation(async (input) => input);

    const draft = await service.createGeneratedDraft({
      createdByUserId: 'admin-1',
      subject: 'Physics',
      chapter: 'Electric Charges and Fields',
      topic: "Coulomb's Law and Charge",
      bloomLevel: 'Apply',
      difficulty: 'Medium',
      generated: {
        question_text: 'A generated question long enough for quality checks.',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'B',
        explanation:
          'A sufficiently detailed explanation that supports a reviewer decision.',
      },
    });

    expect(draft.status).toBe(QuestionPublicationStatus.DRAFT);
    expect(draft.source).toBe(QuestionSource.AI_GENERATED);
    expect(draft.published_at).toBeNull();
    expect(draft.quality_score).toBeGreaterThanOrEqual(80);
  });

  it('falls back to the topic as a concept tag when the model suggests none', async () => {
    questionsRepository.create.mockImplementation((input) => input);
    questionsRepository.save.mockImplementation(async (input) => input);

    const draft = await service.createGeneratedDraft({
      createdByUserId: 'admin-1',
      subject: 'Physics',
      chapter: 'Electric Charges and Fields',
      topic: "Coulomb's Law and Charge",
      bloomLevel: 'Apply',
      difficulty: 'Medium',
      generated: {
        question_text: 'A generated question long enough for quality checks.',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'B',
        explanation:
          'A sufficiently detailed explanation that supports a reviewer decision.',
      },
    });

    expect(draft.concept_tags).toEqual(["Coulomb's Law and Charge"]);
    expect(draft.common_errors).toEqual([]);
  });

  it('pre-fills AI-suggested concept tags, common errors, and difficulty-scaled marks — still landing as an unpublished draft', async () => {
    questionsRepository.create.mockImplementation((input) => input);
    questionsRepository.save.mockImplementation(async (input) => input);

    const draft = await service.createGeneratedDraft({
      createdByUserId: 'admin-1',
      subject: 'Physics',
      chapter: 'Electric Charges and Fields',
      topic: "Coulomb's Law and Charge",
      bloomLevel: 'Apply',
      difficulty: 'Hard',
      generated: {
        question_text: 'A generated question long enough for quality checks.',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'B',
        explanation:
          'A sufficiently detailed explanation that supports a reviewer decision.',
        concept_tags: ['Coulomb force', 'inverse-square law'],
        common_errors: ['Using 1/r instead of 1/r²'],
      },
    });

    expect(draft.concept_tags).toEqual(['Coulomb force', 'inverse-square law']);
    expect(draft.common_errors).toEqual(['Using 1/r instead of 1/r²']);
    expect(draft.marks).toBe(5);
    // The suggestions are pre-filled, never auto-published.
    expect(draft.status).toBe(QuestionPublicationStatus.DRAFT);
    expect(draft.published_at).toBeNull();
  });

  it('keeps draft answer keys inside the admin-only review query', async () => {
    questionsRepository.find.mockResolvedValue([{ id: 'draft-1' }]);

    const result = await service.findAdminAll({
      status: QuestionPublicationStatus.DRAFT,
      source: QuestionSource.AI_GENERATED,
      limit: 10,
    });

    expect(result).toEqual([{ id: 'draft-1' }]);
    expect(questionsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: QuestionPublicationStatus.DRAFT,
          source: QuestionSource.AI_GENERATED,
        },
        take: 10,
      }),
    );
  });

  it('immediately excludes a reported AI-pool question from future selection', async () => {
    generatedQuestionsRepository.findOne.mockResolvedValue({
      id: 'gen-1',
      status: GeneratedLearningQuestionStatus.READY,
    });
    generatedQuestionsRepository.save.mockImplementation(
      async (input) => input,
    );
    questionReportsRepository.create.mockImplementation((input) => input);
    questionReportsRepository.save.mockImplementation(async (input) => input);

    await service.reportQuestion('student-1', {
      questionSource: LearningQuestionSource.AI_POOL,
      generatedQuestionId: 'gen-1',
      reason: QuestionReportReason.WRONG_ANSWER,
    });

    expect(generatedQuestionsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'gen-1',
        status: GeneratedLearningQuestionStatus.REJECTED,
      }),
    );
    expect(questionReportsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        questionSource: LearningQuestionSource.AI_POOL,
        generatedQuestionId: 'gen-1',
        status: QuestionReportStatus.OPEN,
      }),
    );
  });

  it('leaves a reported curated question published and only queues the report', async () => {
    questionsRepository.findOne.mockResolvedValue({ id: 'q-1' });
    questionReportsRepository.create.mockImplementation((input) => input);
    questionReportsRepository.save.mockImplementation(async (input) => input);

    await service.reportQuestion('student-1', {
      questionSource: LearningQuestionSource.CURATED,
      questionId: 'q-1',
      reason: QuestionReportReason.CONFUSING_WORDING,
    });

    expect(questionsRepository.save).not.toHaveBeenCalled();
    expect(questionReportsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        questionSource: LearningQuestionSource.CURATED,
        questionId: 'q-1',
      }),
    );
  });

  it('marks a report resolved by an admin', async () => {
    questionReportsRepository.findOne.mockResolvedValue({
      id: 'report-1',
      status: QuestionReportStatus.OPEN,
    });
    questionReportsRepository.save.mockImplementation(async (input) => input);

    const resolved = await service.resolveReport('report-1', 'admin-1', {
      action: 'RESOLVE',
    });

    expect(resolved.status).toBe(QuestionReportStatus.RESOLVED);
    expect(resolved.resolvedByUserId).toBe('admin-1');
  });

  it('persists a hand-typed question as a curated draft, never auto-published', async () => {
    questionsRepository.create.mockImplementation((input) => input);
    questionsRepository.save.mockImplementation(async (input) => input);

    const created = await service.createCurated(
      'admin-1',
      validQuestionRow() as never,
    );

    expect(created.status).toBe(QuestionPublicationStatus.DRAFT);
    expect(created.source).toBe(QuestionSource.CURATED);
    expect(created.question_id).toMatch(/^MAN-/);
  });

  it('rejects creating a question whose correct_answer is not one of its options', async () => {
    await expect(
      service.createCurated(
        'admin-1',
        validQuestionRow({ correct_answer: 'Z' }) as never,
      ),
    ).rejects.toThrow('correct_answer must be one of options');
    expect(questionsRepository.save).not.toHaveBeenCalled();
  });

  it('edits a question in place without touching its publication status', async () => {
    questionsRepository.findOne.mockResolvedValue({
      question_id: 'MAN-1',
      status: QuestionPublicationStatus.PUBLISHED,
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'B',
    });
    questionsRepository.save.mockImplementation(async (input) => input);

    const updated = await service.updateQuestion('MAN-1', 'admin-1', {
      question_text: 'A corrected question wording for the same item.',
    } as never);

    expect(updated.status).toBe(QuestionPublicationStatus.PUBLISHED);
    expect(updated.question_text).toBe(
      'A corrected question wording for the same item.',
    );
    expect(updated.reviewed_by_user_id).toBe('admin-1');
  });

  it('lets a reviewer edit AI-suggested common errors and concept tags', async () => {
    questionsRepository.findOne.mockResolvedValue({
      question_id: 'AI-1',
      status: QuestionPublicationStatus.DRAFT,
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'B',
      concept_tags: ['Coulomb force'],
      common_errors: ['Using 1/r instead of 1/r²'],
    });
    questionsRepository.save.mockImplementation(async (input) => input);

    const updated = await service.updateQuestion('AI-1', 'admin-1', {
      concept_tags: ['Coulomb force', 'superposition'],
      common_errors: ['Forgetting the sign of the charge'],
    } as never);

    expect(updated.concept_tags).toEqual(['Coulomb force', 'superposition']);
    expect(updated.common_errors).toEqual([
      'Forgetting the sign of the charge',
    ]);
  });

  it('rejects an edit that moves correct_answer outside the (possibly new) options', async () => {
    questionsRepository.findOne.mockResolvedValue({
      question_id: 'MAN-1',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'B',
    });

    await expect(
      service.updateQuestion('MAN-1', 'admin-1', {
        correct_answer: 'Z',
      } as never),
    ).rejects.toThrow('correct_answer must be one of options');
    expect(questionsRepository.save).not.toHaveBeenCalled();
  });

  it('hard-deletes a question with no attempt history', async () => {
    questionsRepository.findOne.mockResolvedValue({
      id: 'q-1',
      question_id: 'MAN-1',
    });
    manager.count.mockResolvedValue(0);
    questionsRepository.remove.mockResolvedValue(undefined);

    await service.deleteQuestion('MAN-1');

    expect(questionsRepository.remove).toHaveBeenCalled();
  });

  it('refuses to delete a question that has been used in past attempts', async () => {
    questionsRepository.findOne.mockResolvedValue({
      id: 'q-1',
      question_id: 'MAN-1',
    });
    manager.count
      .mockResolvedValueOnce(3) // practice
      .mockResolvedValueOnce(0) // diagnostic
      .mockResolvedValueOnce(0); // mock test

    await expect(service.deleteQuestion('MAN-1')).rejects.toThrow(
      ConflictException,
    );
    expect(questionsRepository.remove).not.toHaveBeenCalled();
  });

  it('flags a bulk-import row with an out-of-range difficulty', async () => {
    const result = await service.validateQuestionRow(
      validQuestionRow({ difficulty: 'Extreme' }),
      1,
    );

    expect(result.valid).toBe(false);
    expect(result.row).toBe(1);
  });

  it('imports the valid rows in a batch and reports the rest as failed', async () => {
    questionsRepository.create.mockImplementation((input) => input);
    questionsRepository.save.mockImplementation(async (input) => input);

    const result = await service.bulkImportQuestions('admin-1', [
      validQuestionRow(),
      validQuestionRow({ correct_answer: 'not-an-option' }),
    ]);

    expect(result.inserted).toBe(1);
    expect(result.failed).toEqual([
      { row: 2, errors: ['correct_answer must be one of options'] },
    ]);
  });

  it('flags an Easy-tagged question that almost nobody answers correctly', async () => {
    manager.query.mockResolvedValue([
      {
        id: 'q-1',
        question_id: 'MAN-1',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
        question_text: 'A mistagged question.',
        difficulty: 'Easy',
        quality_score: 80,
        total_answers: '20',
        correct_answers: '4',
      },
      {
        id: 'q-2',
        question_id: 'MAN-2',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
        question_text: 'A correctly-tagged question.',
        difficulty: 'Easy',
        quality_score: 80,
        total_answers: '20',
        correct_answers: '18',
      },
    ]);

    const result = await service.getDifficultyCalibration();

    expect(manager.query).toHaveBeenCalledWith(expect.any(String), [10]);
    expect(result).toEqual([
      expect.objectContaining({
        question_id: 'MAN-1',
        observedAccuracy: 0.2,
        mismatched: true,
      }),
      expect.objectContaining({
        question_id: 'MAN-2',
        observedAccuracy: 0.9,
        mismatched: false,
      }),
    ]);
  });
});
