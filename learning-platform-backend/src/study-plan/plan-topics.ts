import type { PlanTopicRow } from '../catalog/catalog.types';
import type { PlanTopic } from './plan-generator';

export const topicKey = (subject: string, chapter: string, topic: string) =>
  `${subject}|${chapter}|${topic}`;

/**
 * Class 11 students get Class 11 chapters, Class 12 students get Class 12
 * chapters, and a Dropper / Repeater (or a student who has not said) gets both.
 * A chapter with no class level yet is never hidden from anyone.
 */
export function includeForClass(
  classLevel: number | null,
  className: string | null,
): boolean {
  if (classLevel === null) return true;
  if (className === '11') return classLevel === 11;
  if (className === '12') return classLevel === 12;
  return true;
}

/**
 * The topics still to be scheduled: right class, not already Completed by the
 * student's answers, and not already ticked off in the plan being rebuilt.
 * Order is kept (the catalog supplies syllabus order).
 */
export function selectTopicsToPlan(
  rows: readonly PlanTopicRow[],
  className: string | null,
  doneKeys: ReadonlySet<string>,
): PlanTopic[] {
  return rows
    .filter(
      (row) =>
        includeForClass(row.classLevel, className) &&
        row.learningStatus !== 'COMPLETED' &&
        !doneKeys.has(topicKey(row.subject, row.chapter, row.topic)),
    )
    .map((row) => ({
      subject: row.subject,
      chapter: row.chapter,
      scopeChapter: row.scopeChapter,
      topic: row.topic,
      chapterMinutes: row.chapterMinutes,
      chapterTopicCount: row.chapterTopicCount,
    }));
}
