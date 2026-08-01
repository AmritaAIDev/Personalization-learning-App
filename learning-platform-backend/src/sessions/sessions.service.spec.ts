import { Repository } from 'typeorm';
import { LearningTopicStatus } from '../adaptive/adaptive.types';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  const findMock = jest.fn();
  const statesRepository = {
    find: findMock,
  } as unknown as Repository<LearningTopicState>;

  const service = new SessionsService(statesRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('projects the adaptive state into journey chapters without legacy sessions', async () => {
    findMock.mockResolvedValue([
      {
        id: 'gauss-state',
        userId: 'student-1',
        subject: 'Physics',
        chapter: 'Electric Charges and Fields',
        topic: 'Gauss Law',
        status: LearningTopicStatus.ACTIVE,
        totalAnswered: 12,
        totalCorrect: 6,
      },
      {
        id: 'field-state',
        userId: 'student-1',
        subject: 'Physics',
        chapter: 'Electric Charges and Fields',
        topic: 'Electric charge & field',
        status: LearningTopicStatus.MASTERED,
        totalAnswered: 20,
        totalCorrect: 18,
      },
    ] as LearningTopicState[]);

    await expect(service.getJourneyForUser('student-1')).resolves.toEqual([
      {
        id: 'Physics:Electric Charges and Fields',
        subject: 'Physics',
        name: 'Electric Charges and Fields',
        state: 'active',
        score: 75,
        subtopics: [
          expect.objectContaining({
            id: 'gauss-state',
            name: 'Gauss Law',
            score: 50,
            state: 'active',
          }),
          expect.objectContaining({
            id: 'field-state',
            name: 'Electric charge & field',
            score: 100,
            state: 'completed',
          }),
        ],
      },
    ]);
    expect(findMock).toHaveBeenCalledWith({
      where: { userId: 'student-1' },
      order: { lastActivityAt: 'ASC' },
    });
  });

  it('keeps a paused topic locked in the journey', async () => {
    findMock.mockResolvedValue([
      {
        id: 'paused-state',
        userId: 'student-1',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Electric flux',
        status: LearningTopicStatus.PAUSED_FOR_PREREQUISITE,
        totalAnswered: 2,
        totalCorrect: 0,
      },
    ] as LearningTopicState[]);

    const [chapter] = await service.getJourneyForUser('student-1');

    expect(chapter.state).toBe('locked');
    expect(chapter.subtopics[0]).toEqual(
      expect.objectContaining({ state: 'locked', score: 0 }),
    );
  });
});
