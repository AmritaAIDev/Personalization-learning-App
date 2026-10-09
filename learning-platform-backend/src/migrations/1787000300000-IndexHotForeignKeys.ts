import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * DB audit: foreign keys on the paths the product actually queries had no
 * index. Per-question accuracy (Subjects analytics, chapter stats) joins every
 * answer table to `questions` by `question_id`, deleting a question has to
 * find its answers, and `test_sessions` is looked up per user. Indexes only,
 * `IF NOT EXISTS`, so it is safe to apply while the previous release serves.
 */
const INDEXES: ReadonlyArray<readonly [string, string, string]> = [
  ['IDX_practice_answers_question', 'practice_answers', 'question_id'],
  ['IDX_diagnostic_answers_question', 'diagnostic_answers', 'question_id'],
  ['IDX_mock_test_answers_question', 'mock_test_answers', 'question_id'],
  [
    'IDX_learning_session_items_question',
    'learning_session_items',
    'question_id',
  ],
  ['IDX_bookmarked_questions_question', 'bookmarked_questions', 'question_id'],
  ['IDX_flashcard_reviews_flashcard', 'flashcard_reviews', 'flashcard_id'],
  ['IDX_doubts_thread', 'doubts', 'thread_id'],
  ['IDX_test_sessions_user', 'test_sessions', 'user_id'],
];

export class IndexHotForeignKeys1787000300000 implements MigrationInterface {
  name = 'IndexHotForeignKeys1787000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, table, column] of INDEXES) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${name}" ON "${table}" ("${column}")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [name] of INDEXES) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
    }
  }
}
