import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Database audit 2026-10-10, findings S1 + S7 (second pass).
 *
 * S7: three more FK-less uuid references (all verified orphan-free on both
 * databases before this migration):
 *   - notebook_concept_summaries.user_id is NOT NULL → CASCADE, matching
 *     every other user-owned table's delete semantics;
 *   - question_reports.question_id / generated_question_id are nullable
 *     polymorphic references → SET NULL.
 *
 * S1: fourteen foreign keys without a supporting index. Postgres does not
 * index FK columns automatically, so each unindexed FK makes every
 * parent-row delete/update a sequential scan of the child table (and
 * blocks the parent's other writers while it runs). Indexes added here
 * cover both the pre-existing FKs and the ones introduced by the audit's
 * previous migration.
 */
export class CompleteAuditRemediation1787000700000 implements MigrationInterface {
  name = 'CompleteAuditRemediation1787000700000';

  private readonly indexes: ReadonlyArray<[string, string, string]> = [
    ['IDX_test_sessions_topic_id', 'test_sessions', 'topic_id'],
    ['IDX_questions_created_by_user_id', 'questions', 'created_by_user_id'],
    ['IDX_questions_reviewed_by_user_id', 'questions', 'reviewed_by_user_id'],
    [
      'IDX_learning_session_items_generated_question_id',
      'learning_session_items',
      'generated_question_id',
    ],
    [
      'IDX_learning_generated_questions_generation_job_id',
      'learning_generated_questions',
      'generation_job_id',
    ],
    [
      'IDX_tutor_messages_related_session_item_id',
      'tutor_messages',
      'related_session_item_id',
    ],
    [
      'IDX_question_reports_reported_by_user_id',
      'question_reports',
      'reported_by_user_id',
    ],
    ['IDX_doubts_question_id', 'doubts', 'question_id'],
    ['IDX_doubts_learning_session_id', 'doubts', 'learning_session_id'],
    [
      'IDX_doubts_learning_session_item_id',
      'doubts',
      'learning_session_item_id',
    ],
    ['IDX_doubts_practice_attempt_id', 'doubts', 'practice_attempt_id'],
    [
      'IDX_question_reports_resolved_by_user_id',
      'question_reports',
      'resolved_by_user_id',
    ],
    [
      'IDX_targeted_practice_questions_source_question_id',
      'targeted_practice_questions',
      'source_question_id',
    ],
    [
      'IDX_misconception_hits_last_question_id',
      'misconception_hits',
      'last_question_id',
    ],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notebook_concept_summaries"
        ADD CONSTRAINT "FK_notebook_concept_summaries_user"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "question_reports"
        ADD CONSTRAINT "FK_question_reports_question"
        FOREIGN KEY ("question_id") REFERENCES "questions"("id")
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "question_reports"
        ADD CONSTRAINT "FK_question_reports_generated_question"
        FOREIGN KEY ("generated_question_id")
        REFERENCES "learning_generated_questions"("id") ON DELETE SET NULL
    `);
    for (const [index, table, column] of this.indexes) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${index}" ON "${table}" ("${column}")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [index, table] of this.indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${table}"."${index}"`);
    }
    await queryRunner.query(
      `ALTER TABLE "question_reports" DROP CONSTRAINT IF EXISTS "FK_question_reports_generated_question"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_reports" DROP CONSTRAINT IF EXISTS "FK_question_reports_question"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notebook_concept_summaries" DROP CONSTRAINT IF EXISTS "FK_notebook_concept_summaries_user"`,
    );
  }
}
