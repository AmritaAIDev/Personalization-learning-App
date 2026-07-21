import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSecureDiagnostics1784300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" varchar(64) NOT NULL UNIQUE,
        "expires_at" timestamp NOT NULL,
        "revoked_at" timestamp,
        "last_seen_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_user_expires" ON "auth_sessions" ("user_id", "expires_at")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "diagnostic_attempts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" varchar(100) NOT NULL,
        "title" varchar(160) NOT NULL,
        "chapter_scope" jsonb NOT NULL,
        "question_ids" jsonb NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'IN_PROGRESS',
        "total_questions" integer NOT NULL,
        "correct_count" integer NOT NULL DEFAULT 0,
        "score_percent" integer NOT NULL DEFAULT 0,
        "analysis" jsonb,
        "started_at" timestamp NOT NULL,
        "expires_at" timestamp NOT NULL,
        "submitted_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_diagnostic_attempt_status"
          CHECK ("status" IN ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_diagnostic_attempts_user_status" ON "diagnostic_attempts" ("user_id", "status")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "diagnostic_answers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "attempt_id" uuid NOT NULL REFERENCES "diagnostic_attempts"("id") ON DELETE CASCADE,
        "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE RESTRICT,
        "selected_option" text,
        "elapsed_seconds" integer,
        "is_correct" boolean,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_diagnostic_answers_attempt_question" UNIQUE ("attempt_id", "question_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_diagnostic_answers_attempt" ON "diagnostic_answers" ("attempt_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_resources" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "subject" varchar(100) NOT NULL,
        "topic" varchar(160) NOT NULL,
        "resource_type" varchar(20) NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text,
        "url" text,
        "content" text,
        "is_general" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_learning_resource_type"
          CHECK ("resource_type" IN ('VIDEO', 'NOTES', 'PRACTICE', 'FORMULA'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_resources_lookup" ON "learning_resources" ("subject", "topic", "is_general")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "learning_resources"');
    await queryRunner.query('DROP TABLE IF EXISTS "diagnostic_answers"');
    await queryRunner.query('DROP TABLE IF EXISTS "diagnostic_attempts"');
    await queryRunner.query('DROP TABLE IF EXISTS "auth_sessions"');
  }
}
