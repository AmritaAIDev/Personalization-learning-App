import { DataSource, Repository } from 'typeorm';
import type { GeneratedLearningQuestionPayload } from '../agent/agent.service';
import { AgentService } from '../agent/agent.service';
import { Question, QuestionPublicationStatus } from '../question.entity';
import { Flashcard } from './flashcard.entity';
import { GeneratedLearningQuestion } from './generated-learning-question.entity';
import { GenerationJob } from './generation-job.entity';
import { AdaptiveContentService } from './adaptive-content.service';
import {
  GenerationJobStatus,
  LearningQuestionSource,
  type LearningCoordinate,
} from './adaptive.types';

describe('AdaptiveContentService question selection', () => {
  const coordinate: LearningCoordinate = {
    level: 1,
    bloomLevel: 'Recall',
    difficulty: 'Easy',
    label: 'Level 1: Recall · Easy',
  };

  it('does not select questions already used by the learner for the topic coordinate', async () => {
    const usedQuestion = {
      id: 'used-question',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      bloom_level: 'Recall',
      difficulty: 'Easy',
      question_text: 'Used question',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A',
      solution: 'Used solution',
      concept_tags: [],
      common_errors: [],
      status: QuestionPublicationStatus.PUBLISHED,
    } as unknown as Question;
    const freshQuestions = Array.from({ length: 5 }, (_, index) => ({
      ...usedQuestion,
      id: `fresh-${index}`,
      question_text: `Fresh question ${index}`,
    })) as unknown as Question[];
    const queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(async () => [
        { questionId: 'used-question', generatedQuestionId: null },
      ]),
    };
    const dataSource = {
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => queryBuilder),
      })),
    } as unknown as DataSource;
    const findQuestions = jest.fn(async () => [
      usedQuestion,
      ...freshQuestions,
    ]);
    const questionsRepository = {
      find: findQuestions,
    } as unknown as Repository<Question>;
    const generatedQuestionsRepository = {
      find: jest.fn(async () => [] as GeneratedLearningQuestion[]),
    } as unknown as Repository<GeneratedLearningQuestion>;
    const service = new AdaptiveContentService(
      dataSource,
      {} as AgentService,
      questionsRepository,
      generatedQuestionsRepository,
      {} as Repository<GenerationJob>,
      {} as Repository<Flashcard>,
    );

    const selected = await service.selectQuestionSet(
      'user-id',
      {
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
      },
      coordinate,
    );

    expect(selected).toHaveLength(5);
    expect(findQuestions).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          difficulty: 'Easy',
          status: QuestionPublicationStatus.PUBLISHED,
        }),
      }),
    );
    expect(selected).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          source: LearningQuestionSource.CURATED,
          id: 'used-question',
        }),
      ]),
    );
  });

  it('reports coordinate coverage for all 12 levels without creating mock frontend data', async () => {
    const dataSource = {} as DataSource;
    const questionsRepository = {
      count: jest.fn(async ({ where }: { where: { difficulty: string } }) =>
        where.difficulty === 'Easy' ? 5 : 2,
      ),
    } as unknown as Repository<Question>;
    const generatedQuestionsRepository = {
      count: jest.fn(async ({ where }: { where: { difficulty: string } }) =>
        where.difficulty === 'Hard' ? 4 : 0,
      ),
    } as unknown as Repository<GeneratedLearningQuestion>;
    const service = new AdaptiveContentService(
      dataSource,
      {} as AgentService,
      questionsRepository,
      generatedQuestionsRepository,
      {} as Repository<GenerationJob>,
      {} as Repository<Flashcard>,
    );

    const coverage = await service.getCoverage({
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
    });

    expect(coverage.coordinates).toHaveLength(12);
    expect(coverage.coordinates[0]).toMatchObject({
      level: 1,
      bloomLevel: 'Recall',
      difficulty: 'Easy',
      curatedPublished: 5,
      generatedReady: 0,
      totalReady: 5,
      readyForSession: true,
    });
    expect(coverage.coordinates[2]).toMatchObject({
      level: 3,
      difficulty: 'Hard',
      curatedPublished: 2,
      generatedReady: 4,
      totalReady: 6,
      readyForSession: true,
    });
    expect(coverage.coordinates[1]).toMatchObject({
      level: 2,
      difficulty: 'Medium',
      totalReady: 2,
      readyForSession: false,
    });
  });
});

describe('AdaptiveContentService AI-pool quality gate', () => {
  const sourceQuestion = {
    id: 'src-1',
    question_text: 'Grounded reference question for the topic.',
    solution: 'Grounded reference solution.',
    concept_tags: [],
  } as unknown as Question;

  function buildService(
    generated: GeneratedLearningQuestionPayload[],
    save: jest.Mock,
  ) {
    const dataSource = {} as DataSource;
    const agentService = {
      generateLearningQuestionBatch: jest.fn(async () => generated),
    } as unknown as AgentService;
    const questionsRepository = {
      find: jest.fn(async () => [sourceQuestion]),
    } as unknown as Repository<Question>;
    const generatedQuestionsRepository = {
      create: jest.fn((input) => input),
      save,
    } as unknown as Repository<GeneratedLearningQuestion>;
    const flashcardsRepository = {
      find: jest.fn(async () => []),
    } as unknown as Repository<Flashcard>;
    const jobsRepository = {
      save: jest.fn(async (input) => input),
    } as unknown as Repository<GenerationJob>;
    return new AdaptiveContentService(
      dataSource,
      agentService,
      questionsRepository,
      generatedQuestionsRepository,
      jobsRepository,
      flashcardsRepository,
    );
  }

  function job(): GenerationJob {
    return {
      id: 'job-1',
      userId: 'user-1',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      bloomLevel: 'Recall',
      difficulty: 'Easy',
      targetLevel: 1,
      requestedCount: 2,
      status: GenerationJobStatus.PROCESSING,
      generatedCount: 0,
    } as unknown as GenerationJob;
  }

  it('drops a low-quality AI-pool question instead of serving it to a student', async () => {
    const highQuality: GeneratedLearningQuestionPayload = {
      question_text: 'A fully grounded, sufficiently detailed prompt.',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A',
      explanation: 'A thorough explanation that clears the quality floor.',
      hint: 'A useful hint.',
      concept_tags: ['gauss law'],
      common_errors: ['assuming symmetry incorrectly'],
    };
    const lowQuality: GeneratedLearningQuestionPayload = {
      question_text: 'Short prompt.',
      options: ['A', 'A', 'A', 'B'], // only 2 distinct options
      correct_answer: 'A',
      explanation: 'Too short.',
      hint: 'Hint.',
      concept_tags: ['gauss law'],
      common_errors: ['error'],
    };
    const save = jest.fn(async (records) => records);
    const service = buildService([highQuality, lowQuality], save);
    const currentJob = job();

    await service.generateForJob(currentJob);

    expect(save).toHaveBeenCalledTimes(1);
    const savedRecords = save.mock.calls[0][0] as Array<{
      questionText: string;
    }>;
    expect(savedRecords).toHaveLength(1);
    expect(savedRecords[0].questionText).toBe(highQuality.question_text);
    expect(currentJob.generatedCount).toBe(1);
    expect(currentJob.status).toBe(GenerationJobStatus.COMPLETED);
  });
});
