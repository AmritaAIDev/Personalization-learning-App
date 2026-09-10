import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotebookService } from '../notebook/notebook.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { CompetencyService } from '../adaptive/competency.service';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { LearningResource } from '../diagnostics/learning-resource.entity';
import { LearningResourceType } from '../diagnostics/diagnostic.types';
import type {
  RevisionHubPayload,
  RevisionRecommendations,
  RevisionResourceView,
  RevisionTopicRecommendation,
  RevisionTopicView,
} from './revision.types';

const MISTAKE_LIMIT = 40;
const WEAK_TOPIC_LIMIT = 8;
const RECENT_TOPIC_LIMIT = 6;
/** Recommendation lookups are capped separately from the weak-topic list shown, so the page stays fast even for a student with many weak topics. */
const RECOMMENDATION_TOPIC_LIMIT = 5;

/**
 * Phase 6 of the jee-compass-inspired feature plan
 * (docs/JEE-COMPASS-INSPIRATION-PLAN.md): one page combining wrong answers,
 * bookmarks, weak topics, recent activity and recommendations.
 *
 * Deliberately built on top of existing services rather than re-querying
 * their underlying tables:
 *  - Wrong answers reuse NotebookService.getMistakes() as-is (practice +
 *    adaptive + diagnostic, deduped to the latest attempt per question,
 *    with its existing DUE/UPCOMING review state standing in for
 *    "unresolved/resolved"). Mock-test wrong answers are out of scope for
 *    the same reason Notebook itself excludes them: MockTestAnswer has no
 *    single subject and isn't part of that dedup model.
 *  - Weak/recent topics reuse CompetencyService.getGrowth() (the same
 *    per-topic score+band already computed for the dashboard's subject
 *    coverage), cross-referenced with LearningTopicState.lastActivityAt for
 *    recency — this is "latest known state per topic", not a re-derivation
 *    of one diagnostic attempt's weakTopics.
 *  - Recommendations mirror diagnostics.service.ts's getRecommendations()
 *    resource-matching query shape, generalised from one attempt's subject
 *    to the student's current weak-topic set across all subjects.
 */
@Injectable()
export class RevisionService {
  constructor(
    private readonly notebookService: NotebookService,
    private readonly bookmarksService: BookmarksService,
    private readonly competencyService: CompetencyService,
    @InjectRepository(LearningTopicState)
    private readonly topicStates: Repository<LearningTopicState>,
    @InjectRepository(LearningResource)
    private readonly resources: Repository<LearningResource>,
  ) {}

  async getHub(userId: string): Promise<RevisionHubPayload> {
    const [mistakes, bookmarks, growth, recentStates] = await Promise.all([
      this.notebookService.getMistakes(userId, MISTAKE_LIMIT),
      this.bookmarksService.getBookmarks(userId),
      this.competencyService.getGrowth(userId),
      this.topicStates.find({
        where: { userId },
        order: { lastActivityAt: 'DESC' },
        take: RECENT_TOPIC_LIMIT,
      }),
    ]);

    const trackedTopics = growth.topics.filter((topic) => topic.answered > 0);
    const weakTopics: RevisionTopicView[] = trackedTopics
      .filter(
        (topic) => topic.band === 'Beginner' || topic.band === 'Developing',
      )
      .sort((left, right) => left.score - right.score)
      .slice(0, WEAK_TOPIC_LIMIT)
      .map((topic) => ({
        subject: topic.subject,
        chapter: topic.chapter,
        topic: topic.topic,
        score: topic.score,
        band: topic.band,
      }));

    const growthByScope = new Map(
      growth.topics.map((topic) => [
        this.scopeKey(topic.subject, topic.chapter, topic.topic),
        topic,
      ]),
    );
    const recentlyPracticed = recentStates.map((state) => {
      const match = growthByScope.get(
        this.scopeKey(state.subject, state.chapter, state.topic),
      );
      return {
        subject: state.subject,
        chapter: state.chapter,
        topic: state.topic,
        score: match?.score ?? 0,
        band: match?.band ?? ('Beginner' as const),
        lastActivityAt: state.lastActivityAt.toISOString(),
      };
    });

    const recommendations = await this.getRecommendations(weakTopics);

    const dueCount = mistakes.cards.filter(
      (card) => card.reviewState === 'DUE',
    ).length;

    return {
      summary: {
        dueCount,
        resolvedCount: mistakes.cards.length - dueCount,
        bookmarkCount: bookmarks.length,
        weakTopicCount: weakTopics.length,
        recentCount: recentlyPracticed.length,
      },
      wrong: mistakes.cards,
      bookmarks,
      weakTopics,
      recentlyPracticed,
      recommendations,
    };
  }

  private async getRecommendations(
    weakTopics: RevisionTopicView[],
  ): Promise<RevisionRecommendations> {
    if (weakTopics.length === 0) {
      return { generalResources: [], topicRecommendations: [] };
    }
    const limited = weakTopics.slice(0, RECOMMENDATION_TOPIC_LIMIT);
    const weakSubjects = Array.from(new Set(limited.map((t) => t.subject)));
    const weakTopicNames = Array.from(new Set(limited.map((t) => t.topic)));

    const resources = await this.resources.find({
      where: [
        { subject: In(weakSubjects), isGeneral: true },
        { isGeneral: false, topic: In(weakTopicNames) },
      ],
      order: { topic: 'ASC', resourceType: 'ASC', title: 'ASC' },
    });

    const topicRecommendations: RevisionTopicRecommendation[] = limited.map(
      (weak) => {
        const topicResources = resources.filter(
          (resource) => !resource.isGeneral && resource.topic === weak.topic,
        );
        const formula = topicResources.find(
          (resource) => resource.resourceType === LearningResourceType.FORMULA,
        );
        return {
          topic: weak.topic,
          formula: formula?.content ?? null,
          resources: topicResources
            .filter(
              (resource) =>
                resource.resourceType !== LearningResourceType.FORMULA,
            )
            .map((resource) => this.toResourceView(resource)),
        };
      },
    );

    return {
      generalResources: resources
        .filter((resource) => resource.isGeneral)
        .map((resource) => this.toResourceView(resource)),
      topicRecommendations,
    };
  }

  private toResourceView(resource: LearningResource): RevisionResourceView {
    return {
      id: resource.id,
      type: resource.resourceType,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      content: resource.content,
    };
  }

  private scopeKey(subject: string, chapter: string, topic: string): string {
    return `${subject}|${chapter}|${topic}`;
  }
}
