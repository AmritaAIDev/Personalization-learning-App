import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  BLOOM_LEVELS,
  coordinateForLevel,
  DIFFICULTY_LEVELS,
  LEARNING_LEVEL_COUNT,
  LearningSessionStatus,
  LearningTopicStatus,
} from './adaptive.types';
import { LearningSession } from './learning-session.entity';
import { LearningTopicState } from './learning-topic-state.entity';

/**
 * Weighted topic-competency score (DOMAIN_LOGIC §4):
 *
 *   0.45·Accuracy + 0.20·Difficulty + 0.20·Bloom + 0.10·Speed + 0.05·Consistency
 *
 * plus a longitudinal growth timeline derived from completed sessions.
 */
const WEIGHTS = {
  accuracy: 0.45,
  difficulty: 0.2,
  bloom: 0.2,
  speed: 0.1,
  consistency: 0.05,
} as const;

// Seconds a confident answer should take; faster (down to this) reads as fluent.
const SPEED_TARGET_SECONDS = 45;

export type CompetencyBand =
  'Beginner' | 'Developing' | 'Proficient' | 'Advanced';

export interface CompetencyBreakdown {
  accuracy: number;
  difficulty: number;
  bloom: number;
  speed: number;
  consistency: number;
}

export interface TopicCompetency {
  subject: string;
  chapter: string;
  topic: string;
  level: number;
  bloomLevel: string;
  difficulty: string;
  masteryPercent: number;
  accuracyPercent: number;
  answered: number;
  score: number;
  band: CompetencyBand;
  status: LearningTopicStatus;
}

export interface GrowthPoint {
  date: string;
  masteryPercent: number;
  level: number;
  bloomLevel: string;
  difficulty: string;
  transition: string;
  topic: string;
  label: string;
}

export interface GrowthPayload {
  overall: {
    score: number;
    band: CompetencyBand;
    breakdown: CompetencyBreakdown;
    topicsTracked: number;
    mastered: number;
    answered: number;
    momentum: number;
    positiveStreak: number;
  };
  topics: TopicCompetency[];
  timeline: GrowthPoint[];
}

interface AnswerAgg {
  avgElapsed: number | null;
  variance: number | null;
  count: number;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(Math.max(value, min), max);
}

function scopeKey(subject: string, chapter: string, topic: string): string {
  return `${subject}||${chapter}||${topic}`;
}

function bandFor(score: number): CompetencyBand {
  if (score >= 85) return 'Advanced';
  if (score >= 70) return 'Proficient';
  if (score >= 45) return 'Developing';
  return 'Beginner';
}

@Injectable()
export class CompetencyService {
  constructor(
    @InjectRepository(LearningTopicState)
    private readonly statesRepository: Repository<LearningTopicState>,
    @InjectRepository(LearningSession)
    private readonly sessionsRepository: Repository<LearningSession>,
    private readonly dataSource: DataSource,
  ) {}

  async getGrowth(userId: string): Promise<GrowthPayload> {
    const [states, answerAggs, sessions] = await Promise.all([
      this.statesRepository.find({ where: { userId } }),
      this.loadAnswerAggregates(userId),
      this.sessionsRepository.find({
        where: { userId },
        order: { completedAt: 'ASC' },
        take: 80,
      }),
    ]);

    const topics: TopicCompetency[] = states.map((state) => {
      const coordinate = coordinateForLevel(state.currentLevel);
      const accuracy =
        state.totalAnswered > 0 ? state.totalCorrect / state.totalAnswered : 0;
      const difficulty =
        DIFFICULTY_LEVELS.indexOf(coordinate.difficulty) /
        (DIFFICULTY_LEVELS.length - 1);
      const bloom =
        BLOOM_LEVELS.indexOf(coordinate.bloomLevel) / (BLOOM_LEVELS.length - 1);

      const agg = answerAggs.get(
        scopeKey(state.subject, state.chapter, state.topic),
      );
      const speed = this.speedScore(agg);
      const consistency = this.consistencyScore(agg, accuracy);

      const breakdown: CompetencyBreakdown = {
        accuracy,
        difficulty,
        bloom,
        speed,
        consistency,
      };
      const score = this.weightedScore(breakdown);
      const masteryPercent = Math.round(
        ((state.currentLevel - 1) / (LEARNING_LEVEL_COUNT - 1)) * 100,
      );

      return {
        subject: state.subject,
        chapter: state.chapter,
        topic: state.topic,
        level: state.currentLevel,
        bloomLevel: coordinate.bloomLevel,
        difficulty: coordinate.difficulty,
        masteryPercent,
        accuracyPercent: Math.round(accuracy * 100),
        answered: state.totalAnswered,
        score,
        band: bandFor(score),
        status: state.status,
      };
    });

    const timeline = this.buildTimeline(sessions);
    const overall = this.buildOverall(topics, timeline);

    return { overall, topics, timeline };
  }

  private weightedScore(breakdown: CompetencyBreakdown): number {
    const raw =
      WEIGHTS.accuracy * breakdown.accuracy +
      WEIGHTS.difficulty * breakdown.difficulty +
      WEIGHTS.bloom * breakdown.bloom +
      WEIGHTS.speed * breakdown.speed +
      WEIGHTS.consistency * breakdown.consistency;
    return Math.round(clamp(raw) * 100);
  }

  private speedScore(agg: AnswerAgg | undefined): number {
    if (!agg || !agg.avgElapsed || agg.avgElapsed <= 0) return 0.6;
    return clamp(SPEED_TARGET_SECONDS / agg.avgElapsed);
  }

  private consistencyScore(
    agg: AnswerAgg | undefined,
    accuracy: number,
  ): number {
    if (!agg || agg.count < 2 || agg.variance === null) {
      return clamp(0.4 + accuracy * 0.4);
    }
    // Bernoulli variance peaks at 0.25 (maximally erratic); invert to reward steadiness.
    return clamp(1 - agg.variance / 0.25);
  }

  private buildTimeline(sessions: LearningSession[]): GrowthPoint[] {
    return sessions
      .filter(
        (session) =>
          session.completedAt &&
          session.status !== LearningSessionStatus.ACTIVE,
      )
      .map((session) => ({
        date: session.completedAt!.toISOString(),
        masteryPercent: Math.round(
          ((session.level - 1) / (LEARNING_LEVEL_COUNT - 1)) * 100,
        ),
        level: session.level,
        bloomLevel: session.bloomLevel,
        difficulty: session.difficulty,
        transition: session.transition,
        topic: session.topic,
        label: `${session.bloomLevel} · ${session.difficulty}`,
      }));
  }

  private buildOverall(
    topics: TopicCompetency[],
    timeline: GrowthPoint[],
  ): GrowthPayload['overall'] {
    const answered = topics.reduce((sum, topic) => sum + topic.answered, 0);
    const tracked = topics.length;
    const mastered = topics.filter(
      (topic) => topic.status === LearningTopicStatus.MASTERED,
    ).length;

    // Weight each topic by evidence (answers) so lightly-touched topics don't dominate.
    const weight = (topic: TopicCompetency) => Math.max(topic.answered, 1);
    const weightSum =
      topics.reduce((sum, topic) => sum + weight(topic), 0) || 1;
    const avg = (pick: (topic: TopicCompetency) => number) =>
      topics.reduce((sum, topic) => sum + pick(topic) * weight(topic), 0) /
      weightSum;

    const score = tracked === 0 ? 0 : Math.round(avg((topic) => topic.score));
    const breakdown: CompetencyBreakdown = {
      accuracy: tracked === 0 ? 0 : avg((topic) => topic.accuracyPercent / 100),
      difficulty:
        tracked === 0
          ? 0
          : avg(
              (topic) =>
                DIFFICULTY_LEVELS.indexOf(
                  topic.difficulty as (typeof DIFFICULTY_LEVELS)[number],
                ) /
                (DIFFICULTY_LEVELS.length - 1),
            ),
      bloom:
        tracked === 0
          ? 0
          : avg(
              (topic) =>
                BLOOM_LEVELS.indexOf(
                  topic.bloomLevel as (typeof BLOOM_LEVELS)[number],
                ) /
                (BLOOM_LEVELS.length - 1),
            ),
      speed: 0,
      consistency: 0,
    };

    // Momentum: how much mastery has risen across the recorded timeline.
    const momentum =
      timeline.length >= 2
        ? timeline[timeline.length - 1].masteryPercent -
          timeline[0].masteryPercent
        : 0;

    // Positive streak: trailing run of non-regressing checkpoints.
    let positiveStreak = 0;
    for (let index = timeline.length - 1; index >= 0; index -= 1) {
      if (
        timeline[index].transition === 'DEMOTED' ||
        timeline[index].transition === 'PREREQUISITE'
      ) {
        break;
      }
      positiveStreak += 1;
    }

    return {
      score,
      band: bandFor(score),
      breakdown,
      topicsTracked: tracked,
      mastered,
      answered,
      momentum,
      positiveStreak,
    };
  }

  private async loadAnswerAggregates(
    userId: string,
  ): Promise<Map<string, AnswerAgg>> {
    type AnswerAggregateRow = {
      subject: string;
      chapter: string;
      topic: string;
      avg_elapsed: number | string | null;
      variance: number | string | null;
      n: number | string;
    };
    const map = new Map<string, AnswerAgg>();
    try {
      const rows = (await this.dataSource.query(
        `SELECT s.subject, s.chapter, s.topic,
                AVG(a.elapsed_seconds)::float AS avg_elapsed,
                VAR_POP(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::float AS variance,
                COUNT(*)::int AS n
         FROM learning_answers a
         JOIN learning_session_items i ON i.id = a.session_item_id
         JOIN learning_sessions s ON s.id = i.session_id
         WHERE s.user_id = $1
         GROUP BY s.subject, s.chapter, s.topic`,
        [userId],
      )) as unknown as AnswerAggregateRow[];
      for (const row of rows) {
        map.set(scopeKey(row.subject, row.chapter, row.topic), {
          avgElapsed: row.avg_elapsed === null ? null : Number(row.avg_elapsed),
          variance: row.variance === null ? null : Number(row.variance),
          count: Number(row.n),
        });
      }
    } catch {
      // Growth degrades gracefully to accuracy-only if the aggregate query fails.
    }
    return map;
  }
}
