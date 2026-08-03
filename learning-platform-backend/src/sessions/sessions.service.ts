import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, QuestionPublicationStatus } from '../question.entity';
import { LearningTopicStatus } from '../adaptive/adaptive.types';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';

type JourneyState = 'locked' | 'active' | 'completed';

/**
 * Projects the adaptive learner state into the Journey/Curriculum UI.
 * The adaptive state is the sole progress source; legacy test sessions are
 * deliberately not consulted here.
 */
@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(LearningTopicState)
    private readonly topicStatesRepository: Repository<LearningTopicState>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
  ) {}

  async getJourneyForUser(userId: string) {
    const [states, catalog] = await Promise.all([
      this.topicStatesRepository.find({
        where: { userId },
        order: { lastActivityAt: 'ASC' },
      }),
      this.questionsRepository
        .createQueryBuilder('question')
        .select('question.subject', 'subject')
        .addSelect('question.chapter', 'chapter')
        .addSelect('question.topic', 'topic')
        .where('question.status = :status', { status: QuestionPublicationStatus.PUBLISHED })
        .groupBy('question.subject')
        .addGroupBy('question.chapter')
        .addGroupBy('question.topic')
        .orderBy('question.subject', 'ASC')
        .addOrderBy('question.chapter', 'ASC')
        .addOrderBy('question.topic', 'ASC')
        .getRawMany<{ subject: string; chapter: string; topic: string }>(),
    ]);
    const statesByScope = new Map(
      states.map((state) => [
        `${state.subject}\u0000${state.chapter}\u0000${state.topic}`,
        state,
      ]),
    );

    const chapters = new Map<
      string,
      {
        subject: string;
        chapter: string;
        states: LearningTopicState[];
      }
    >();

    for (const entry of catalog) {
      const key = `${entry.subject}\u0000${entry.chapter}`;
      const current = chapters.get(key) ?? {
        subject: entry.subject,
        chapter: entry.chapter,
        states: [],
      };
      current.states.push(
        statesByScope.get(`${entry.subject}\u0000${entry.chapter}\u0000${entry.topic}`) ??
          Object.assign(new LearningTopicState(), {
            subject: entry.subject,
            chapter: entry.chapter,
            topic: entry.topic,
            status: LearningTopicStatus.ACTIVE,
            totalAnswered: 0,
            totalCorrect: 0,
          }),
      );
      chapters.set(key, current);
    }

    return Array.from(chapters.values()).map(({ subject, chapter, states }) => {
      const subtopics = states.map((state) => ({
        id: state.id,
        name: state.topic,
        score: this.masteryPercent(state),
        state: this.toJourneyState(state),
        nodeType:
          state.status === LearningTopicStatus.MASTERED
            ? 'history'
            : 'next-step',
        prerequisites: [],
      }));
      const chapterScore = Math.round(
        subtopics.reduce(
          (total, subtopic) => total + (subtopic.score ?? 0),
          0,
        ) / subtopics.length,
      );

      return {
        id: `${subject}:${chapter}`,
        name: chapter,
        subject,
        state: this.chapterState(states),
        score: chapterScore,
        subtopics,
      };
    });
  }

  private masteryPercent(state: LearningTopicState) {
    if (state.status === LearningTopicStatus.MASTERED) return 100;
    if (state.totalAnswered === 0) return 0;
    return Math.round((state.totalCorrect / state.totalAnswered) * 100);
  }

  private toJourneyState(state: LearningTopicState): JourneyState {
    if (state.status === LearningTopicStatus.MASTERED) return 'completed';
    if (state.status === LearningTopicStatus.PAUSED_FOR_PREREQUISITE)
      return 'locked';
    return 'active';
  }

  private chapterState(states: LearningTopicState[]): JourneyState {
    if (
      states.every((state) => state.status === LearningTopicStatus.MASTERED)
    ) {
      return 'completed';
    }
    if (states.some((state) => state.status === LearningTopicStatus.ACTIVE)) {
      return 'active';
    }
    return 'locked';
  }
}
