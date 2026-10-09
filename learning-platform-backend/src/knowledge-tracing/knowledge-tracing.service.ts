import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { AnswerEvent } from '../catalog/catalog.analytics';
import { loadAnswerEvents } from '../catalog/answer-events.query';
import { bktTrace, LOW_DATA_ATTEMPTS, masteryBand, MasteryBand } from './bkt';
import { SkillMastery } from './skill-mastery.entity';

export interface SkillMasteryView {
  subject: string;
  chapter: string;
  topic: string;
  /** P(learned) from the BKT trace, 0..1. */
  pKnow: number;
  attempts: number;
  correct: number;
  band: MasteryBand;
  /** 'low' = fewer than LOW_DATA_ATTEMPTS observations behind the estimate. */
  confidence: 'low' | 'ok';
  lastTracedAt: string | null;
}

export interface MasterySummary {
  mastered: number;
  developing: number;
  weak: number;
  tracked: number;
}

const skillKey = (e: { subject: string; chapter: string; topic: string }) =>
  `${e.subject}\u0000${e.chapter}\u0000${e.topic}`;

/**
 * BKT keeps recency-weighted beliefs; the last N observations per skill are
 * plenty and keep recomputation bounded for large histories.
 */
const MAX_OBSERVATIONS_PER_SKILL = 50;

/** Below this many attempts a "weak" band is mostly noise, so weak lists skip it. */
const MIN_ATTEMPTS_FOR_WEAK = 2;

/**
 * Knowledge tracing: turns every graded answer a learner gives — across
 * practice, diagnostics, mock tests and adaptive sessions — into a per-skill
 * BKT probability, persisted as a recomputable snapshot in `skill_mastery`.
 *
 * Recompute-on-read (the achievements pattern): every public call refreshes
 * from the answer events first, so the snapshot can never silently go stale
 * and there is no write path to wire into the four answer pipelines.
 */
@Injectable()
export class KnowledgeTracingService {
  constructor(
    @InjectRepository(SkillMastery)
    private readonly masteryRepository: Repository<SkillMastery>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Recompute the learner's snapshot and return the full view. */
  async masteryFor(
    userId: string,
    subject?: string | null,
  ): Promise<SkillMasteryView[]> {
    const rows = await this.refresh(userId, subject ?? null);
    return rows.map((row) => this.toView(row));
  }

  /**
   * The learner's shakiest tracked skills, weakest first. Used by analysis
   * and (next slice) the adaptive engine's level decisions.
   */
  async weakSkills(
    userId: string,
    subject: string | null,
    limit: number,
  ): Promise<SkillMasteryView[]> {
    const views = await this.masteryFor(userId, subject);
    return views
      .filter(
        (view) =>
          view.attempts >= MIN_ATTEMPTS_FOR_WEAK &&
          (view.band === 'weak' ||
            (view.band === 'developing' && view.pKnow < 0.65)),
      )
      .sort((a, b) => a.pKnow - b.pKnow)
      .slice(0, limit);
  }

  /** Band counts for the tracked skills — the /progress summary strip. */
  async summary(
    userId: string,
    subject?: string | null,
  ): Promise<MasterySummary> {
    const views = await this.masteryFor(userId, subject);
    return views.reduce<MasterySummary>(
      (acc, view) => {
        if (view.band === 'mastered') acc.mastered += 1;
        else if (view.band === 'developing') acc.developing += 1;
        else if (view.band === 'weak') acc.weak += 1;
        acc.tracked += 1;
        return acc;
      },
      { mastered: 0, developing: 0, weak: 0, tracked: 0 },
    );
  }

  /**
   * Fold every skill's graded history through BKT and upsert the snapshot.
   * Deterministic given the events, so concurrent readers converge.
   */
  private async refresh(
    userId: string,
    subject: string | null,
  ): Promise<SkillMastery[]> {
    const events = await loadAnswerEvents(
      this.dataSource,
      userId,
      subject,
      null,
    );
    const bySkill = new Map<string, AnswerEvent[]>();
    for (const event of events) {
      const key = skillKey(event);
      const list = bySkill.get(key);
      if (list) list.push(event);
      else bySkill.set(key, [event]);
    }

    const saved: SkillMastery[] = [];
    for (const [, skillEvents] of bySkill) {
      const chronological = skillEvents
        .slice()
        .sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime());
      const recent = chronological.slice(-MAX_OBSERVATIONS_PER_SKILL);
      const observations = recent.map((event) => event.isCorrect);
      const pKnow = bktTrace(observations);
      const correct = observations.filter(Boolean).length;
      const head = chronological[0];
      const last = chronological[chronological.length - 1];

      const existing = await this.masteryRepository.findOne({
        where: {
          userId,
          subject: head.subject,
          chapter: head.chapter,
          topic: head.topic,
        },
      });
      const row = this.masteryRepository.create({
        ...(existing ?? {}),
        userId,
        subject: head.subject,
        chapter: head.chapter,
        topic: head.topic,
        pKnow,
        attempts: recent.length,
        correct,
        lastTracedAt: last.answeredAt,
      });
      saved.push(await this.masteryRepository.save(row));
    }

    return saved;
  }

  private toView(row: SkillMastery): SkillMasteryView {
    // numeric columns arrive from Postgres as strings; freshly created rows
    // may still hold the raw number. Normalise once, here, to the stored
    // 3-decimal precision so both paths agree.
    const pKnow = Math.round(Number(row.pKnow) * 1000) / 1000;
    return {
      subject: row.subject,
      chapter: row.chapter,
      topic: row.topic,
      pKnow,
      attempts: row.attempts,
      correct: row.correct,
      band: masteryBand(pKnow, row.attempts),
      confidence: row.attempts < LOW_DATA_ATTEMPTS ? 'low' : 'ok',
      lastTracedAt: row.lastTracedAt
        ? new Date(row.lastTracedAt).toISOString()
        : null,
    };
  }
}
