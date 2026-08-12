import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMockTests1786700000000 implements MigrationInterface {
  name = 'CreateMockTests1786700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mock_test_attempts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" varchar(20) NOT NULL DEFAULT 'IN_PROGRESS',
        "question_ids" jsonb NOT NULL,
        "total_questions" integer NOT NULL,
        "subject_counts" jsonb NOT NULL,
        "difficulty_mix" jsonb NOT NULL,
        "correct_count" integer NOT NULL DEFAULT 0,
        "incorrect_count" integer NOT NULL DEFAULT 0,
        "unattempted_count" integer NOT NULL DEFAULT 0,
        "raw_score" integer NOT NULL DEFAULT 0,
        "max_possible_score" integer NOT NULL,
        "score_percent" integer NOT NULL DEFAULT 0,
        "percentile" integer,
        "subject_breakdown" jsonb,
        "started_at" timestamp NOT NULL,
        "expires_at" timestamp NOT NULL,
        "submitted_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_mock_test_attempt_status"
          CHECK ("status" IN ('IN_PROGRESS', 'SUBMITTED'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_mock_test_attempts_user_status" ON "mock_test_attempts" ("user_id", "status")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_mock_test_attempts_score_percent" ON "mock_test_attempts" ("score_percent") WHERE "status" = \'SUBMITTED\'',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mock_test_answers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "attempt_id" uuid NOT NULL REFERENCES "mock_test_attempts"("id") ON DELETE CASCADE,
        "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE RESTRICT,
        "selected_option" text,
        "elapsed_seconds" integer,
        "is_correct" boolean,
        "marks_awarded" integer,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_mock_test_answers_attempt_question" UNIQUE ("attempt_id", "question_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_mock_test_answers_attempt" ON "mock_test_answers" ("attempt_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "mock_test_answers"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_mock_test_attempts_score_percent"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "mock_test_attempts"');
  }
}
