import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A student-facing "report an issue" mechanism. It closes the one real gap
 * left in the AI-content safety net: admin-curated generation already has a
 * DRAFT -> review -> PUBLISH gate, and the adaptive per-user pool already
 * gets automated structural validation, but neither catches a *semantically*
 * wrong (factually incorrect) AI-generated question before a student sees
 * it — the adaptive pool in particular is generated and served in real time,
 * so it can't wait on human pre-review. This gives students a way to flag
 * one, and gives reviewers a queue to act on it.
 */
export class CreateQuestionReports1786600000000 implements MigrationInterface {
  name = 'CreateQuestionReports1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "question_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reported_by_user_id" uuid NOT NULL,
        "question_source" character varying(20) NOT NULL,
        "question_id" uuid,
        "generated_question_id" uuid,
        "reason" character varying(60) NOT NULL,
        "details" text,
        "status" character varying(20) NOT NULL DEFAULT 'OPEN',
        "resolved_by_user_id" uuid,
        "resolved_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_question_reports_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_question_reports_reporter" FOREIGN KEY ("reported_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_question_reports_source" CHECK ("question_source" IN ('CURATED', 'AI_POOL')),
        CONSTRAINT "CHK_question_reports_status" CHECK ("status" IN ('OPEN', 'DISMISSED', 'RESOLVED'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_question_reports_status" ON "question_reports" ("status", "created_at")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_question_reports_question" ON "question_reports" ("question_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_question_reports_generated_question" ON "question_reports" ("generated_question_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_question_reports_generated_question"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_question_reports_question"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_question_reports_status"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "question_reports"');
  }
}
