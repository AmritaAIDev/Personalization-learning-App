import { RevisionService } from './revision.service';
import { LearningResourceType } from '../diagnostics/diagnostic.types';

function makeTopic(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic: "Coulomb's Law",
    level: 1,
    bloomLevel: 'Remember',
    difficulty: 'Easy',
    masteryPercent: 30,
    accuracyPercent: 30,
    answered: 5,
    score: 30,
    band: 'Beginner',
    status: 'ACTIVE',
    ...overrides,
  };
}

describe('RevisionService', () => {
  const notebookService = { getMistakes: jest.fn() };
  const bookmarksService = { getBookmarks: jest.fn() };
  const competencyService = { getGrowth: jest.fn() };
  const topicStates = { find: jest.fn() };
  const resources = { find: jest.fn() };
  let service: RevisionService;

  beforeEach(() => {
    jest.resetAllMocks();
    notebookService.getMistakes.mockResolvedValue({
      cards: [],
      total: 0,
      summary: {},
    });
    bookmarksService.getBookmarks.mockResolvedValue([]);
    competencyService.getGrowth.mockResolvedValue({
      overall: {},
      topics: [],
      timeline: [],
    });
    topicStates.find.mockResolvedValue([]);
    resources.find.mockResolvedValue([]);
    service = new RevisionService(
      notebookService as never,
      bookmarksService as never,
      competencyService as never,
      topicStates as never,
      resources as never,
    );
  });

  it('splits mistake cards into due/resolved counts by review state', async () => {
    notebookService.getMistakes.mockResolvedValue({
      cards: [
        { reviewState: 'DUE' },
        { reviewState: 'DUE' },
        { reviewState: 'UPCOMING' },
      ],
      total: 3,
      summary: {},
    });
    const hub = await service.getHub('user-1');
    expect(hub.summary.dueCount).toBe(2);
    expect(hub.summary.resolvedCount).toBe(1);
  });

  it('only surfaces tracked, weak (Beginner/Developing) topics, weakest first', async () => {
    competencyService.getGrowth.mockResolvedValue({
      overall: {},
      timeline: [],
      topics: [
        makeTopic({ topic: 'Weak A', score: 20, band: 'Beginner' }),
        makeTopic({ topic: 'Strong', score: 90, band: 'Advanced' }),
        makeTopic({ topic: 'Weak B', score: 50, band: 'Developing' }),
        makeTopic({
          topic: 'Untracked',
          score: 0,
          band: 'Beginner',
          answered: 0,
        }),
      ],
    });
    const hub = await service.getHub('user-1');
    expect(hub.weakTopics.map((t) => t.topic)).toEqual(['Weak A', 'Weak B']);
    expect(hub.summary.weakTopicCount).toBe(2);
  });

  it('caps weak topics at the configured limit', async () => {
    competencyService.getGrowth.mockResolvedValue({
      overall: {},
      timeline: [],
      topics: Array.from({ length: 12 }, (_, i) =>
        makeTopic({ topic: `Topic ${i}`, score: i, band: 'Beginner' }),
      ),
    });
    const hub = await service.getHub('user-1');
    expect(hub.weakTopics).toHaveLength(8);
  });

  it('merges recently-active topic states with their growth score/band', async () => {
    topicStates.find.mockResolvedValue([
      {
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: "Coulomb's Law",
        lastActivityAt: new Date('2026-01-05T00:00:00.000Z'),
      },
    ]);
    competencyService.getGrowth.mockResolvedValue({
      overall: {},
      timeline: [],
      topics: [
        makeTopic({
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: "Coulomb's Law",
          score: 65,
          band: 'Developing',
        }),
      ],
    });
    const hub = await service.getHub('user-1');
    expect(hub.recentlyPracticed).toEqual([
      {
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: "Coulomb's Law",
        score: 65,
        band: 'Developing',
        lastActivityAt: '2026-01-05T00:00:00.000Z',
      },
    ]);
  });

  it('skips the resource lookup entirely when there are no weak topics', async () => {
    const hub = await service.getHub('user-1');
    expect(resources.find).not.toHaveBeenCalled();
    expect(hub.recommendations).toEqual({
      generalResources: [],
      topicRecommendations: [],
    });
  });

  it("splits formula content out of a weak topic's resource list, and separates general resources", async () => {
    competencyService.getGrowth.mockResolvedValue({
      overall: {},
      timeline: [],
      topics: [makeTopic({ score: 20, band: 'Beginner' })],
    });
    resources.find.mockResolvedValue([
      {
        id: 'r1',
        subject: 'Physics',
        topic: "Coulomb's Law",
        resourceType: LearningResourceType.FORMULA,
        title: 'Formula',
        description: null,
        url: null,
        content: 'F = kq1q2/r^2',
        isGeneral: false,
      },
      {
        id: 'r2',
        subject: 'Physics',
        topic: "Coulomb's Law",
        resourceType: LearningResourceType.VIDEO,
        title: 'Video',
        description: 'desc',
        url: 'https://example.com',
        content: null,
        isGeneral: false,
      },
      {
        id: 'r3',
        subject: 'Physics',
        topic: 'general',
        resourceType: LearningResourceType.NOTES,
        title: 'General notes',
        description: null,
        url: null,
        content: null,
        isGeneral: true,
      },
    ]);
    const hub = await service.getHub('user-1');
    expect(hub.recommendations.topicRecommendations).toEqual([
      {
        topic: "Coulomb's Law",
        formula: 'F = kq1q2/r^2',
        resources: [
          {
            id: 'r2',
            type: 'VIDEO',
            title: 'Video',
            description: 'desc',
            url: 'https://example.com',
            content: null,
          },
        ],
      },
    ]);
    expect(hub.recommendations.generalResources).toEqual([
      {
        id: 'r3',
        type: 'NOTES',
        title: 'General notes',
        description: null,
        url: null,
        content: null,
      },
    ]);
  });
});
