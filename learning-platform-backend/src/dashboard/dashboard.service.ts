import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdaptiveService } from '../adaptive/adaptive.service';
import { CompetencyService } from '../adaptive/competency.service';
import { LearningTopicStatus } from '../adaptive/adaptive.types';
import type { LearningScope } from '../adaptive/adaptive-content.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { NotebookService } from '../notebook/notebook.service';
import { Question, QuestionPublicationStatus } from '../question.entity';
import type {
  DashboardAction,
  DashboardActivity,
  DashboardRevisionTopic,
  DashboardSubjectCoverage,
  DashboardTopicProgressStatus,
} from './dashboard.types';

/**
 * Composes the student home view from existing, user-owned learning records.
 * This service deliberately returns only progress and navigation metadata—never
 * answer keys, notebook solutions, tutor content, or question text.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly adaptiveService: AdaptiveService,
    private readonly competencyService: CompetencyService,
    private readonly diagnosticsService: DiagnosticsService,
    private readonly notebookService: NotebookService,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
  ) {}

  async getStudentDashboard(user: AuthenticatedUser) {
    const [learning, growth, diagnosticsResponse, notebook] = await Promise.all(
      [
        this.adaptiveService.getDashboard(user.id),
        this.competencyService.getGrowth(user.id),
        this.diagnosticsService.getDashboard(user.id),
        this.notebookService.getMistakes(user.id, 24),
      ],
    );
    const diagnostics = diagnosticsResponse.data;
    const dueCards = notebook.cards.filter(
      (card) => card.reviewState === 'DUE',
    );
    const revisionTopics = this.toRevisionTopics(dueCards);
    const activeTopic = learning.activeTopics.find(
      (topic) => topic.status === LearningTopicStatus.ACTIVE,
    );
    const suggestedTopic = learning.suggestions[0];
    const primary = this.getPrimaryAction({
      activeAttempt: diagnostics.activeAttempt,
      activeTopic,
      dueCount: dueCards.length,
      suggestedTopic,
    });

    return {
      student: {
        name: user.name,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
      },
      diagnostics,
      learning,
      growth,
      revision: {
        dueCount: dueCards.length,
        upcomingCount: notebook.cards.filter(
          (card) => card.reviewState === 'UPCOMING',
        ).length,
        topics: revisionTopics,
      },
      courseProgress: {
        trackedTopics: growth.overall.topicsTracked,
        masteredTopics: growth.overall.mastered,
        percent:
          growth.overall.topicsTracked === 0
            ? 0
            : Math.round(
                (growth.overall.mastered / growth.overall.topicsTracked) * 100,
              ),
      },
      today: {
        primary,
        actions: this.getPlanActions({
          primary,
          activeTopic,
          dueCount: dueCards.length,
          suggestedTopic,
        }),
      },
      activity: this.getActivity(learning.history, diagnostics.recentAttempts),
      subjectCoverage: await this.getSubjectCoverage(growth.topics),
    };
  }

  private async getSubjectCoverage(
    trackedTopics: Array<{
      subject: string;
      chapter: string;
      topic: string;
      score: number;
      status: string;
    }>,
  ): Promise<DashboardSubjectCoverage[]> {
    const catalog = await this.questionsRepository
      .createQueryBuilder('question')
      .select('question.subject', 'subject')
      .addSelect('question.chapter', 'chapter')
      .addSelect('question.topic', 'topic')
      .where('question.status = :status', {
        status: QuestionPublicationStatus.PUBLISHED,
      })
      .groupBy('question.subject')
      .addGroupBy('question.chapter')
      .addGroupBy('question.topic')
      .orderBy('question.subject', 'ASC')
      .addOrderBy('question.chapter', 'ASC')
      .addOrderBy('question.topic', 'ASC')
      .getRawMany<{ subject: string; chapter: string; topic: string }>();

    const progressByTopic = new Map(
      trackedTopics.map((topic) => [
        this.scopeKey(topic.subject, topic.chapter, topic.topic),
        topic,
      ]),
    );
    const subjects = new Map<string, DashboardSubjectCoverage>();
    for (const catalogTopic of catalog) {
      const progress = progressByTopic.get(
        this.scopeKey(catalogTopic.subject, catalogTopic.chapter, catalogTopic.topic),
      );
      const status = this.toCoverageStatus(progress?.status);
      const subject = subjects.get(catalogTopic.subject) ?? {
        subject: catalogTopic.subject,
        totalTopics: 0,
        masteredTopics: 0,
        activeTopics: 0,
        pausedTopics: 0,
        notStartedTopics: 0,
        topics: [],
      };
      subject.totalTopics += 1;
      if (status === 'MASTERED') subject.masteredTopics += 1;
      else if (status === 'ACTIVE') subject.activeTopics += 1;
      else if (status === 'PAUSED') subject.pausedTopics += 1;
      else subject.notStartedTopics += 1;
      subject.topics.push({
        subject: catalogTopic.subject,
        chapter: catalogTopic.chapter,
        topic: catalogTopic.topic,
        status,
        score: progress?.score ?? null,
      });
      subjects.set(catalogTopic.subject, subject);
    }
    return Array.from(subjects.values()).map((subject) => ({
      ...subject,
      topics: subject.topics.sort((left, right) => {
        const priority = this.coveragePriority(left.status) - this.coveragePriority(right.status);
        return priority !== 0 ? priority : (left.score ?? 101) - (right.score ?? 101);
      }),
    }));
  }

  private toCoverageStatus(status: string | undefined): DashboardTopicProgressStatus {
    if (status === LearningTopicStatus.MASTERED) return 'MASTERED';
    if (status === LearningTopicStatus.PAUSED_FOR_PREREQUISITE) return 'PAUSED';
    if (status === LearningTopicStatus.ACTIVE) return 'ACTIVE';
    return 'NOT_STARTED';
  }

  private coveragePriority(status: DashboardTopicProgressStatus): number {
    return { ACTIVE: 0, PAUSED: 1, NOT_STARTED: 2, MASTERED: 3 }[status];
  }

  private scopeKey(subject: string, chapter: string, topic: string): string {
    return `${subject}|${chapter}|${topic}`;
  }

  private getPrimaryAction(input: {
    activeAttempt: { id: string; answeredCount: number } | null;
    activeTopic: LearningScope | null | undefined;
    dueCount: number;
    suggestedTopic: LearningScope | null | undefined;
  }): DashboardAction {
    if (input.activeAttempt) {
      return {
        id: 'resume-diagnostic',
        kind: 'RESUME_DIAGNOSTIC',
        title: 'Resume your diagnostic',
        detail: `${input.activeAttempt.answeredCount} answers are saved.`,
        attemptId: input.activeAttempt.id,
      };
    }
    if (input.dueCount > 0) {
      return {
        id: 'review-mistakes',
        kind: 'REVIEW_MISTAKES',
        title: 'Repair today’s mistakes',
        detail: `${input.dueCount} review${input.dueCount === 1 ? '' : 's'} are due.`,
      };
    }
    if (input.activeTopic) {
      return {
        id: 'continue-topic',
        kind: 'CONTINUE_LEARNING',
        title: `Continue ${input.activeTopic.topic}`,
        detail: 'Continue your adaptive route from the current checkpoint.',
        scope: input.activeTopic,
      };
    }
    if (input.suggestedTopic) {
      return {
        id: 'suggested-topic',
        kind: 'CONTINUE_LEARNING',
        title: `Start ${input.suggestedTopic.topic}`,
        detail: 'This topic is suggested from your current learning evidence.',
        scope: input.suggestedTopic,
      };
    }
    return {
      id: 'find-topic',
      kind: 'FIND_TOPIC',
      title: 'Choose a topic to begin',
      detail: 'Search the verified catalog to open a learning workspace.',
    };
  }

  private getPlanActions(input: {
    primary: DashboardAction;
    activeTopic: LearningScope | null | undefined;
    dueCount: number;
    suggestedTopic: LearningScope | null | undefined;
  }): DashboardAction[] {
    const actions = [input.primary];
    if (input.dueCount > 0 && input.primary.kind !== 'REVIEW_MISTAKES') {
      actions.push({
        id: 'review-mistakes',
        kind: 'REVIEW_MISTAKES',
        title: 'Review mistakes',
        detail: `${input.dueCount} review${input.dueCount === 1 ? '' : 's'} are due today.`,
      });
    }
    if (
      input.activeTopic &&
      input.primary.scope?.topic !== input.activeTopic.topic
    ) {
      actions.push({
        id: 'continue-topic',
        kind: 'CONTINUE_LEARNING',
        title: `Continue ${input.activeTopic.topic}`,
        detail: 'Return to the current adaptive checkpoint.',
        scope: input.activeTopic,
      });
    }
    if (input.suggestedTopic && actions.length < 3) {
      actions.push({
        id: 'suggested-topic',
        kind: 'CONTINUE_LEARNING',
        title: `Explore ${input.suggestedTopic.topic}`,
        detail: 'A suggested next topic from your learning path.',
        scope: input.suggestedTopic,
      });
    }
    return actions.slice(0, 3);
  }

  private toRevisionTopics(
    cards: Array<{ subject: string; chapter: string; topic: string }>,
  ): DashboardRevisionTopic[] {
    const topics = new Map<string, DashboardRevisionTopic>();
    for (const card of cards) {
      const key = `${card.subject}|${card.chapter}|${card.topic}`;
      const existing = topics.get(key);
      if (existing) existing.count += 1;
      else topics.set(key, { ...card, count: 1 });
    }
    return Array.from(topics.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, 3);
  }

  private getActivity(
    learningHistory: Array<{
      id: string;
      subject: string;
      chapter: string;
      topic: string;
      level: number;
      coordinate: { bloomLevel: string; difficulty: string };
      completedAt: Date | null;
    }>,
    diagnostics: Array<{
      id: string;
      completedAt: Date | null;
      scorePercent: number;
    }>,
  ): DashboardActivity[] {
    const activity: DashboardActivity[] = [
      ...learningHistory
        .filter((item) => item.completedAt)
        .map((item) => ({
          id: `learning:${item.id}`,
          type: 'LEARNING' as const,
          title: `${item.topic} checkpoint completed`,
          detail: `Level ${item.level} · ${item.coordinate.bloomLevel} · ${item.coordinate.difficulty}`,
          occurredAt: item.completedAt!.toISOString(),
          subject: item.subject,
          chapter: item.chapter,
          topic: item.topic,
        })),
      ...diagnostics
        .filter((item) => item.completedAt)
        .map((item) => ({
          id: `diagnostic:${item.id}`,
          type: 'DIAGNOSTIC' as const,
          title: 'Diagnostic completed',
          detail: `${item.scorePercent}% score`,
          occurredAt: item.completedAt!.toISOString(),
        })),
    ];
    return activity
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      )
      .slice(0, 4);
  }
}
