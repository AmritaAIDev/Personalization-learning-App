import { DataSource, Repository } from 'typeorm';
import { AgentService } from '../agent/agent.service';
import { Question, QuestionPublicationStatus } from '../question.entity';
import { Flashcard } from './flashcard.entity';
import { GeneratedLearningQuestion } from './generated-learning-question.entity';
import { GenerationJob } from './generation-job.entity';
import { AdaptiveContentService } from './adaptive-content.service';
import {
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
