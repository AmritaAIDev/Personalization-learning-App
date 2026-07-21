import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssessmentService } from './assessment.service';
import { TestSession } from './test-session.entity';
import { Question } from '../question.entity';
import { Topic } from '../topics/topic.entity';
import { Repository } from 'typeorm';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let sessionsRepository: jest.Mocked<Partial<Repository<TestSession>>>;
  let questionsRepository: jest.Mocked<Partial<Repository<Question>>>;
  let topicsRepository: jest.Mocked<Partial<Repository<Topic>>>;

  beforeEach(async () => {
    sessionsRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    questionsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    topicsRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentService,
        {
          provide: getRepositoryToken(TestSession),
          useValue: sessionsRepository,
        },
        {
          provide: getRepositoryToken(Question),
          useValue: questionsRepository,
        },
        {
          provide: getRepositoryToken(Topic),
          useValue: topicsRepository,
        },
      ],
    }).compile();

    service = module.get<AssessmentService>(AssessmentService);
    questionsRepository.findOne?.mockResolvedValue({
      id: 'q1',
      correct_answer: 'Correct option',
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitAnswer algorithm', () => {
    it('should promote taxonomy after 5 correct answers (streak)', async () => {
      const mockSession = {
        user_id: 'u1',
        topic_id: 't1',
        current_taxonomy: 1,
        current_difficulty: 1,
        streak_counter: 4,
        failed_attempts: 0,
        currentScore: 0,
        status: 'in-progress',
      } as TestSession;

      sessionsRepository.findOne.mockResolvedValue(mockSession);
      sessionsRepository.save.mockResolvedValue(mockSession);

      await service.submitAnswer('u1', 't1', 'q1', 'Correct option');

      expect(mockSession.streak_counter).toBe(0);
      expect(mockSession.current_taxonomy).toBe(2); // Promoted!
    });

    it('should trigger Socratic pause on first failed attempt', async () => {
      const mockSession = {
        user_id: 'u1',
        topic_id: 't1',
        current_taxonomy: 3,
        current_difficulty: 2,
        streak_counter: 2,
        failed_attempts: 0,
        currentScore: 20,
        status: 'in-progress',
      } as TestSession;

      sessionsRepository.findOne.mockResolvedValue(mockSession);
      sessionsRepository.save.mockResolvedValue(mockSession);

      const result = await service.submitAnswer(
        'u1',
        't1',
        'q1',
        'Incorrect option',
      );

      expect(mockSession.failed_attempts).toBe(1);
      expect(mockSession.current_taxonomy).toBe(3); // State preserved
      expect(result.status).toBe('socratic_pause');
    });

    it('should demote on second failed attempt', async () => {
      const mockSession = {
        user_id: 'u1',
        topic_id: 't1',
        current_taxonomy: 3,
        current_difficulty: 2,
        streak_counter: 2,
        failed_attempts: 1, // Currently on Socratic pause state
        currentScore: 20,
        status: 'in-progress',
      } as TestSession;

      sessionsRepository.findOne.mockResolvedValue(mockSession);
      sessionsRepository.save.mockResolvedValue(mockSession);

      await service.submitAnswer('u1', 't1', 'q1', 'Incorrect option');

      expect(mockSession.failed_attempts).toBe(0); // Reset
      expect(mockSession.streak_counter).toBe(0); // Reset
      expect(mockSession.current_taxonomy).toBe(2); // Demoted T3 -> T2
    });

    it('should cross difficulty boundary upon reaching T6', async () => {
      const mockSession = {
        user_id: 'u1',
        topic_id: 't1',
        current_taxonomy: 6,
        current_difficulty: 1,
        streak_counter: 4,
        failed_attempts: 0,
        currentScore: 50,
        status: 'in-progress',
      } as TestSession;

      sessionsRepository.findOne.mockResolvedValue(mockSession);
      sessionsRepository.save.mockResolvedValue(mockSession);

      await service.submitAnswer('u1', 't1', 'q1', 'Correct option');

      // Reached T6 limit on D1. Next state is T1 on D2.
      expect(mockSession.current_taxonomy).toBe(1);
      expect(mockSession.current_difficulty).toBe(2);
    });
  });
});
