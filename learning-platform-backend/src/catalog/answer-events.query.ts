import type { DataSource } from 'typeorm';
import type { AnswerEvent } from './catalog.analytics';

interface AnswerEventRow {
  subject: string;
  chapter: string;
  topic: string;
  bloom: string | null;
  is_correct: boolean;
  answered_at: Date | string;
}

/**
 * Every graded answer a student has given, across all four places answers
 * live (practice, diagnostics, mock tests, adaptive learning). This is the
 * single source for every score the catalog shows, so a chapter card, the
 * subject summary and the analytics page can never disagree.
 *
 * - Ungraded rows (`is_correct IS NULL`, i.e. skipped or not yet submitted)
 *   are excluded, so they neither help nor hurt accuracy.
 * - Adaptive learning keeps one row per attempt at a question; only the first
 *   attempt is counted, so a retry after a hint doesn't double-count.
 * - Scope (chapter/topic) comes from the question, or from the learning
 *   session for AI-generated questions, so generated items still count.
 * - `$2` limits to one subject; `$3` limits to one chapter (both optional).
 */
const ANSWER_EVENTS_SQL = `
  SELECT e.subject, e.chapter, e.topic, e.bloom, e.is_correct, e.answered_at
  FROM (
    SELECT q.subject, q.chapter, q.topic, q.bloom_level AS bloom,
           a.is_correct, a.updated_at AS answered_at
    FROM practice_answers a
    JOIN practice_attempts att ON att.id = a.attempt_id
    JOIN questions q ON q.id = a.question_id
    WHERE att.user_id = $1 AND a.is_correct IS NOT NULL

    UNION ALL
    SELECT q.subject, q.chapter, q.topic, q.bloom_level, a.is_correct, a.updated_at
    FROM diagnostic_answers a
    JOIN diagnostic_attempts att ON att.id = a.attempt_id
    JOIN questions q ON q.id = a.question_id
    WHERE att.user_id = $1 AND a.is_correct IS NOT NULL

    UNION ALL
    SELECT q.subject, q.chapter, q.topic, q.bloom_level, a.is_correct, a.updated_at
    FROM mock_test_answers a
    JOIN mock_test_attempts att ON att.id = a.attempt_id
    JOIN questions q ON q.id = a.question_id
    WHERE att.user_id = $1 AND a.is_correct IS NOT NULL

    UNION ALL
    SELECT s.subject, s.chapter, s.topic,
           COALESCE(q.bloom_level, g.bloom_level, s.bloom_level),
           a.is_correct, a.created_at
    FROM learning_answers a
    JOIN learning_session_items i ON i.id = a.session_item_id
    JOIN learning_sessions s ON s.id = i.session_id
    LEFT JOIN questions q ON q.id = i.question_id
    LEFT JOIN learning_generated_questions g ON g.id = i.generated_question_id
    WHERE s.user_id = $1 AND a.attempt_number = 1
  ) e
  WHERE ($2::text IS NULL OR e.subject = $2)
    AND ($3::text IS NULL OR e.chapter = $3)
`;

export async function loadAnswerEvents(
  dataSource: DataSource,
  userId: string,
  subject: string | null,
  chapter: string | null,
): Promise<AnswerEvent[]> {
  const rows: AnswerEventRow[] = await dataSource.query(ANSWER_EVENTS_SQL, [
    userId,
    subject,
    chapter,
  ]);
  return rows.map((row) => ({
    subject: row.subject,
    chapter: row.chapter,
    topic: row.topic,
    bloom: row.bloom,
    isCorrect: row.is_correct,
    answeredAt: new Date(row.answered_at),
  }));
}
