import { QuestionPublicationStatus, QuestionSource } from './question.entity';
import { QuestionsService } from './questions.service';

describe('QuestionsService', () => {
  const questionsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  let service: QuestionsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new QuestionsService(questionsRepository as never);
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
});
