import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { NotebookService } from '../notebook/notebook.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { CompetencyService } from '../adaptive/competency.service';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { LearningResource } from '../diagnostics/learning-resource.entity';
import { LearningResourceType } from '../diagnostics/diagnostic.types';
import { addDays, todayIST } from '../study-plan/plan-dates';
import {
  StudyPlanTask,
  StudyTaskStatus,
} from '../study-plan/study-plan.entity';
import { TARGET_MONTH_PATTERN } from '../users/personalization';
import {
  getTargetPressure,
  WEAK_TOPIC_LIMIT_BY_PHASE,
} from '../users/target-pressure';
import type {
  RevisionHubPayload,
  RevisionRecommendations,
  RevisionResourceView,
  RevisionTopicRecommendation,
  RevisionTargetContext,
  RevisionTopicView,
} from './revision.types';

const MISTAKE_LIMIT = 40;
/** Plan tasks due within this many days count as "coming up" for ranking. */
const PLAN_LOOKAHEAD_DAYS = 14;
/** Score-point boost for a weak topic the study plan schedules soon. */
const PLANNED_SOON_BOOST = 25;
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
    @InjectRepository(StudyPlanTask)
    private readonly planTasks: Repository<StudyPlanTask>,
  ) {}

  /**
   * `targetMonth` (the student's `YYYY-MM` goal) makes the hub target-aware:
   * the closer it is, the longer the weak-topic list, and weak topics the study
   * plan schedules in the next two weeks are ranked first. With no target it
   * behaves exactly as before.
   */
  async getHub(
    userId: string,
    targetMonth: string | null = null,
    now: Date = new Date(),
  ): Promise<RevisionHubPayload> {
    const pressure = getTargetPressure(targetMonth, now);
    const weakLimit = WEAK_TOPIC_LIMIT_BY_PHASE[pressure.phase];
    const [mistakes, bookmarks, growth, recentStates, upcoming] =
      await Promise.all([
        this.notebookService.getMistakes(userId, MISTAKE_LIMIT),
        this.bookmarksService.getBookmarks(userId),
        this.competencyService.getGrowth(userId),
        this.topicStates.find({
          where: { userId },
          order: { lastActivityAt: 'DESC' },
          take: RECENT_TOPIC_LIMIT,
        }),
        pressure.phase === 'none'
          ? Promise.resolve([] as StudyPlanTask[])
          : this.planTasks.find({
              where: {
                plan: { userId },
                status: StudyTaskStatus.PENDING,
                date: LessThanOrEqual(
                  addDays(todayIST(now), PLAN_LOOKAHEAD_DAYS),
                ),
              },
              order: { date: 'ASC' },
            }),
      ]);

    // Earliest pending plan date per topic (tasks arrive date-ascending).
    const plannedFor = new Map<string, string>();
    for (const task of upcoming) {
      const key = this.scopeKey(task.subject, task.chapter, task.topic);
      if (!plannedFor.has(key)) plannedFor.set(key, task.date);
    }
    const rankOf = (topic: {
      subject: string;
      chapter: string;
      topic: string;
      score: number;
    }) =>
      topic.score -
      (plannedFor.has(this.scopeKey(topic.subject, topic.chapter, topic.topic))
        ? PLANNED_SOON_BOOST
        : 0);

    const trackedTopics = growth.topics.filter((topic) => topic.answered > 0);
    const weakTopics: RevisionTopicView[] = trackedTopics
      .filter(
        (topic) => topic.band === 'Beginner' || topic.band === 'Developing',
      )
      .sort((left, right) => rankOf(left) - rankOf(right))
      .slice(0, weakLimit)
      .map((topic) => {
        const planned = plannedFor.get(
          this.scopeKey(topic.subject, topic.chapter, topic.topic),
        );
        return {
          subject: topic.subject,
          chapter: topic.chapter,
          topic: topic.topic,
          score: topic.score,
          band: topic.band,
          ...(planned ? { plannedFor: planned } : {}),
        };
      });

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
      target: this.toTargetContext(targetMonth, pressure),
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

  /** `passed` lets the page ask for a new target instead of going silent. */
  private toTargetContext(
    targetMonth: string | null,
    pressure: ReturnType<typeof getTargetPressure>,
  ): RevisionTargetContext | null {
    if (!targetMonth) return null;
    if (pressure.phase === 'none') {
      return TARGET_MONTH_PATTERN.test(targetMonth)
        ? { targetMonth, daysLeft: 0, phase: 'passed' }
        : null;
    }
    return {
      targetMonth,
      daysLeft: pressure.daysLeft ?? 0,
      phase: pressure.phase,
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
