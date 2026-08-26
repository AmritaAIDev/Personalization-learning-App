import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Production-grade indexes for multi-user scale.
 *
 * Hot paths that were table-scanning:
 * - questions filtering by status+scope (diagnostics, practice, adaptive)
 * - topics hierarchy lookups by parent
 * - auth_sessions by tokenHash
 * These indexes make the app safe for thousands of concurrent learners.
 */
export class AddProductionIndexes1786900600000 implements MigrationInterface {
  name = 'AddProductionIndexes1786900600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_questions_scope_published"
      ON "questions" ("status", "subject", "chapter", "topic")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_questions_question_id"
      ON "questions" ("question_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_topics_parent_id"
      ON "topics" ("parent_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_topics_level"
      ON "topics" ("level")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_token_hash"
      ON "auth_sessions" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_user_id"
      ON "auth_sessions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_practice_attempts_user_id"
      ON "practice_attempts" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_diagnostic_attempts_user_id"
      ON "diagnostic_attempts" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_questions_scope_published"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_questions_question_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_topics_parent_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_topics_level"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_auth_sessions_token_hash"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auth_sessions_user_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_practice_attempts_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_diagnostic_attempts_user_id"`,
    );
  }
}
