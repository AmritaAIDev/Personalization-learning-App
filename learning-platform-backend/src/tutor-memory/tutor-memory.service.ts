import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { loadAnswerEvents } from '../catalog/answer-events.query';
import { KnowledgeTracingService } from '../knowledge-tracing/knowledge-tracing.service';

/**
 * Builds the compact, private learner profile that every tutor/doubt prompt
 * may reference — roadmap 3.2's "the tutor remembers you" feature.
 *
 * Design rules:
 * - Derived on demand from existing truth (BKT snapshot inputs + graded
 *   answer events). No new table, nothing to go stale, nothing to migrate.
 * - No PII ever: topics, probabilities and relative times only. No names,
 *   emails, ids or free-text from the learner's messages.
 * - Hard length cap so a memory block can never crowd out the actual doubt.
 * - Best-effort: any failing source degrades to a shorter profile; a
 *   completely empty profile returns null and prompts stay as they were.
 */
const MAX_MEMORY_CHARACTERS = 600;
const WEAK_SKILLS_SHOWN = 4;
const RECENT_MISSES_SHOWN = 4;

@Injectable()
export class TutorMemoryService {
  private readonly logger = new Logger(TutorMemoryService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tracing: KnowledgeTracingService,
  ) {}

  /** A ready-to-embed learner memory block, or null when there is nothing. */
  async buildLearnerMemory(userId: string): Promise<string | null> {
    const lines: string[] = [];

    try {
      const summary = await this.tracing.summary(userId);
      if (summary.tracked > 0) {
        lines.push(
          `Tracked concepts: ${summary.mastered} mastered, ${summary.developing} developing, ${summary.weak} weak.`,
        );
      }
    } catch (error) {
      this.logger.warn('Learner memory: mastery summary unavailable.', error);
    }

    try {
      const weak = await this.tracing.weakSkills(
        userId,
        null,
        WEAK_SKILLS_SHOWN,
      );
      if (weak.length > 0) {
        lines.push(
          `Weakest right now: ${weak
            .map(
              (skill) =>
                `${skill.topic} (mastery ${Math.round(skill.pKnow * 100)}%, ${skill.attempts} attempts)`,
            )
            .join('; ')}.`,
        );
      }
    } catch (error) {
      this.logger.warn('Learner memory: weak skills unavailable.', error);
    }

    try {
      const events = await loadAnswerEvents(
        this.dataSource,
        userId,
        null,
        null,
      );
      const misses = events
        .filter((event) => !event.isCorrect)
        .sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime());
      const seen = new Set<string>();
      const recent: string[] = [];
      for (const miss of misses) {
        if (seen.has(miss.topic)) continue;
        seen.add(miss.topic);
        recent.push(`${miss.topic} (${relativeTime(miss.answeredAt)})`);
        if (recent.length >= RECENT_MISSES_SHOWN) break;
      }
      if (recent.length > 0) {
        lines.push(`Recent misses: ${recent.join('; ')}.`);
      }
    } catch (error) {
      this.logger.warn('Learner memory: recent misses unavailable.', error);
    }

    if (lines.length === 0) return null;
    const block = lines.join('\n');
    return block.length > MAX_MEMORY_CHARACTERS
      ? `${block.slice(0, MAX_MEMORY_CHARACTERS - 1)}…`
      : block;
  }
}

function relativeTime(at: Date): string {
  const minutes = Math.max(0, Math.round((Date.now() - at.getTime()) / 60_000));
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
