import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { AgentService } from '../agent/agent.service';
import {
  MisconceptionHit,
  MisconceptionSource,
} from './misconception-hit.entity';

export interface WrongAnswerContext {
  userId: string;
  subject: string;
  chapter: string;
  topic: string;
  questionId: string;
  questionText: string;
  options: string[];
  selectedOption: string;
  correctAnswer: string;
  commonErrors: string[];
  source: MisconceptionSource;
}

export interface DominantMisconception {
  text: string;
  count: number;
}

/**
 * Classifies a wrong answer against a question's known `common_errors` and
 * keeps a running per-user tally. This is a remediation signal, not part of
 * the answer-save transaction: every public method here is best-effort and
 * must never throw into a caller's save path.
 */
@Injectable()
export class MisconceptionsService {
  private readonly logger = new Logger(MisconceptionsService.name);

  constructor(
    @InjectRepository(MisconceptionHit)
    private readonly hitsRepository: Repository<MisconceptionHit>,
    private readonly agentService: AgentService,
  ) {}

  async recordFromWrongAnswer(context: WrongAnswerContext): Promise<void> {
    const candidates = context.commonErrors
      .map((error) => error.trim())
      .filter((error) => error.length > 0);
    if (candidates.length === 0) return;

    try {
      const misconception = await this.classify(candidates, context);
      await this.upsertHit(context, misconception);
    } catch (error) {
      // A classification/persistence failure must never break the caller's
      // answer-save flow; the notebook simply won't show a fresher hit yet.
      this.logger.warn(
        `Could not record a misconception hit: ${(error as Error).message}`,
      );
    }
  }

  /** Highest-count misconception for a user's topic, or null if none yet. */
  async getDominantForTopic(
    userId: string,
    subject: string,
    topic: string,
  ): Promise<DominantMisconception | null> {
    const top = await this.hitsRepository.findOne({
      where: { userId, subject, topic },
      order: { hitCount: 'DESC', lastOccurredAt: 'DESC' },
    });
    return top ? { text: top.misconception, count: top.hitCount } : null;
  }

  /**
   * Batch variant for a notebook page rendering many topic groups at once:
   * one query for all of a user's hits instead of one round-trip per group.
   */
  async getDominantByTopic(
    userId: string,
    scopes: Array<{ subject: string; topic: string }>,
  ): Promise<Map<string, DominantMisconception>> {
    const result = new Map<string, DominantMisconception>();
    if (scopes.length === 0) return result;

    const hits = await this.hitsRepository.find({ where: { userId } });
    const bestByKey = new Map<string, MisconceptionHit>();
    for (const hit of hits) {
      const key = `${hit.subject}|${hit.topic}`;
      const current = bestByKey.get(key);
      if (!current || hit.hitCount > current.hitCount) {
        bestByKey.set(key, hit);
      }
    }
    for (const scope of scopes) {
      const hit = bestByKey.get(`${scope.subject}|${scope.topic}`);
      if (hit) {
        result.set(`${scope.subject}|${scope.topic}`, {
          text: hit.misconception,
          count: hit.hitCount,
        });
      }
    }
    return result;
  }

  /**
   * Deterministic when there is only one candidate. Otherwise asks the model
   * which candidate best matches the specific wrong choice, and falls back to
   * a stable (not random) pick so repeated calls for the same wrong answer
   * are consistent even when the model is unavailable.
   */
  private async classify(
    candidates: string[],
    context: WrongAnswerContext,
  ): Promise<string> {
    if (candidates.length === 1) return candidates[0];
    try {
      const index = await this.agentService.classifyMisconception({
        questionText: context.questionText,
        options: context.options,
        selectedOption: context.selectedOption,
        correctAnswer: context.correctAnswer,
        candidates,
      });
      return candidates[index];
    } catch {
      return candidates[
        this.stableIndex(
          `${context.questionId}:${context.selectedOption}`,
          candidates.length,
        )
      ];
    }
  }

  private stableIndex(seed: string, modulus: number): number {
    const hash = createHash('sha256').update(seed).digest();
    return hash.readUInt32BE(0) % modulus;
  }

  private async upsertHit(
    context: WrongAnswerContext,
    misconception: string,
  ): Promise<void> {
    const misconceptionHash = createHash('sha256')
      .update(misconception)
      .digest('hex')
      .slice(0, 40);
    const now = new Date();
    const existing = await this.hitsRepository.findOne({
      where: { userId: context.userId, misconceptionHash },
    });
    if (existing) {
      existing.hitCount += 1;
      existing.subject = context.subject;
      existing.chapter = context.chapter;
      existing.topic = context.topic;
      existing.source = context.source;
      existing.lastQuestionId = context.questionId;
      existing.lastOccurredAt = now;
      await this.hitsRepository.save(existing);
      return;
    }
    await this.hitsRepository.save(
      this.hitsRepository.create({
        userId: context.userId,
        subject: context.subject,
        chapter: context.chapter,
        topic: context.topic,
        misconception,
        misconceptionHash,
        hitCount: 1,
        source: context.source,
        lastQuestionId: context.questionId,
        firstOccurredAt: now,
        lastOccurredAt: now,
      }),
    );
  }
}
