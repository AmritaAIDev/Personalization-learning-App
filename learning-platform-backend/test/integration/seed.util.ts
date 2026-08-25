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

/** Topics used by the low-supply specs, kept separate from the happy path. */
export const SPREAD_TOPIC = 'Integration Spread Topic';
/**
 * The calibration fallback widens from the topic to the whole chapter, so a
 * genuinely starved topic needs a chapter of its own — otherwise it borrows
 * from its siblings and never reaches the unavailable path.
 */
export const THIN_CHAPTER = 'Integration Thin Chapter';
export const THIN_TOPIC = 'Integration Thin Topic';

/**
 * The correct option is always the first one, so a spec can answer correctly
 * without reading the stored solution back out of the database.
 */
export const CORRECT_OPTION = 'A: correct';

export async function seedLevelOneQuestions(
  dataSource: DataSource,
  count: number,
): Promise<void> {
  await seedQuestions(dataSource, {
    topic: TEST_TOPIC,
    idPrefix: `${TEST_QUESTION_PREFIX}L1-`,
    entries: Array.from({ length: count }, () => ({
      bloomLevel: LEVEL_ONE_BLOOM,
      difficulty: LEVEL_ONE_DIFFICULTY,
    })),
  });
}

export interface SeedSpec {
  topic: string;
  /** Defaults to the shared test chapter. */
  chapter?: string;
  idPrefix: string;
  entries: Array<{ bloomLevel: string; difficulty: string }>;
}

/** Seeds questions at explicit adaptive coordinates so supply can be shaped. */
export async function seedQuestions(
  dataSource: DataSource,
  spec: SeedSpec,
): Promise<void> {
  const repository = dataSource.getRepository(Question);
  const rows = spec.entries.map((entry, index) =>
    repository.create({
      question_id: `${spec.idPrefix}${index + 1}`,
      subject: TEST_SUBJECT,
      chapter: spec.chapter ?? TEST_CHAPTER,
      topic: spec.topic,
      subtopic: null,
      question_text: `Integration probe question ${index + 1}`,
      options: [CORRECT_OPTION, 'B: wrong', 'C: wrong', 'D: wrong'],
      correct_answer: CORRECT_OPTION,
      solution: 'INTEGRATION_SOLUTION_SENTINEL',
      bloom_level: entry.bloomLevel,
      difficulty: entry.difficulty,
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
const ALL_TEST_TOPICS = [TEST_TOPIC, THIN_TOPIC, SPREAD_TOPIC];

export async function cleanupTestData(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    `DELETE FROM learning_answers WHERE session_item_id IN (
       SELECT lsi.id FROM learning_session_items lsi
       JOIN learning_sessions ls ON ls.id = lsi.session_id
       JOIN learning_topic_states lts ON lts.id = ls.state_id
       WHERE lts.topic = ANY($1)
     )`,
    [ALL_TEST_TOPICS],
  );
  await dataSource.query(
    `DELETE FROM learning_session_items WHERE session_id IN (
       SELECT ls.id FROM learning_sessions ls
       JOIN learning_topic_states lts ON lts.id = ls.state_id
       WHERE lts.topic = ANY($1)
     )`,
    [ALL_TEST_TOPICS],
  );
  await dataSource.query(
    `DELETE FROM learning_sessions WHERE state_id IN (
       SELECT id FROM learning_topic_states WHERE topic = ANY($1)
     )`,
    [ALL_TEST_TOPICS],
  );
  await dataSource.query(
    `DELETE FROM learning_topic_states WHERE topic = ANY($1)`,
    [ALL_TEST_TOPICS],
  );
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
