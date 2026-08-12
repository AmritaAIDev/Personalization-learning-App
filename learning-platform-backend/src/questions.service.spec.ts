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

describe('QuestionsService', () => {
  const questionsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
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
});
