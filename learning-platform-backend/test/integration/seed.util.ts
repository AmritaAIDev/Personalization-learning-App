import type { DataSource } from 'typeorm';
import { Question } from '../../src/question.entity';

/** Namespaced so integration rows are always distinguishable from real content. */
export const TEST_SUBJECT = 'Physics';
export const TEST_CHAPTER = 'Integration Test Chapter';
export const TEST_TOPIC = 'Integration Test Topic';
export const TEST_QUESTION_PREFIX = 'ITEST-';

/** The Level 1 coordinate every new learner is placed at. */
const LEVEL_ONE_BLOOM = 'Recall';
const LEVEL_ONE_DIFFICULTY = 'Easy';

/**
 * The correct option is always the first one, so a spec can answer correctly
 * without reading the stored solution back out of the database.
 */
export const CORRECT_OPTION = 'A: correct';

export async function seedLevelOneQuestions(
  dataSource: DataSource,
  count: number,
): Promise<void> {
  const repository = dataSource.getRepository(Question);
  const rows = Array.from({ length: count }, (_, index) =>
    repository.create({
      question_id: `${TEST_QUESTION_PREFIX}${index + 1}`,
      subject: TEST_SUBJECT,
      chapter: TEST_CHAPTER,
      topic: TEST_TOPIC,
      subtopic: null,
      question_text: `Integration probe question ${index + 1}`,
      options: [CORRECT_OPTION, 'B: wrong', 'C: wrong', 'D: wrong'],
      correct_answer: CORRECT_OPTION,
      solution: 'INTEGRATION_SOLUTION_SENTINEL',
      bloom_level: LEVEL_ONE_BLOOM,
      difficulty: LEVEL_ONE_DIFFICULTY,
      marks: 4,
      estimated_time_sec: 60,
      concept_tags: ['integration'],
      common_errors: ['integration error'],
    }),
  );
  await repository.save(rows);
}

/**
 * Removes every row this suite created. Ordered child-before-parent because the
 * schema enforces real foreign keys.
 */
export async function cleanupTestData(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    `DELETE FROM learning_answers WHERE session_item_id IN (
       SELECT lsi.id FROM learning_session_items lsi
       JOIN learning_sessions ls ON ls.id = lsi.session_id
       JOIN learning_topic_states lts ON lts.id = ls.state_id
       WHERE lts.topic = $1
     )`,
    [TEST_TOPIC],
  );
  await dataSource.query(
    `DELETE FROM learning_session_items WHERE session_id IN (
       SELECT ls.id FROM learning_sessions ls
       JOIN learning_topic_states lts ON lts.id = ls.state_id
       WHERE lts.topic = $1
     )`,
    [TEST_TOPIC],
  );
  await dataSource.query(
    `DELETE FROM learning_sessions WHERE state_id IN (
       SELECT id FROM learning_topic_states WHERE topic = $1
     )`,
    [TEST_TOPIC],
  );
  await dataSource.query(`DELETE FROM learning_topic_states WHERE topic = $1`, [
    TEST_TOPIC,
  ]);
  await dataSource.query(`DELETE FROM questions WHERE question_id LIKE $1`, [
    `${TEST_QUESTION_PREFIX}%`,
  ]);
}

/** Deletes a throwaway learner and the session rows that hang off it. */
export async function cleanupUser(
  dataSource: DataSource,
  email: string,
): Promise<void> {
  await dataSource.query(
    `DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM users WHERE email = $1)`,
    [email],
  );
  await dataSource.query(`DELETE FROM users WHERE email = $1`, [email]);
}
