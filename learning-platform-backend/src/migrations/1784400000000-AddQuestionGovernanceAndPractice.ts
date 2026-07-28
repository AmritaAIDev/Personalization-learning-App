import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionGovernanceAndPractice1784400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT \'PUBLISHED\'',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "source" varchar(20) NOT NULL DEFAULT \'CURATED\'',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "quality_score" smallint NOT NULL DEFAULT 80',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "reviewed_by_user_id" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "review_notes" text',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "published_at" timestamp',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now()',
    );
    await queryRunner.query(
      'UPDATE "questions" SET "published_at" = COALESCE("published_at", "created_at") WHERE "status" = \'PUBLISHED\'',
    );
    await queryRunner.query(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CHK_questions_status') THEN ALTER TABLE \"questions\" ADD CONSTRAINT \"CHK_questions_status\" CHECK (\"status\" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')); END IF; END $$;",
    );
    await queryRunner.query(
      'DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = \'CHK_questions_source\') THEN ALTER TABLE "questions" ADD CONSTRAINT "CHK_questions_source" CHECK ("source" IN (\'CURATED\', \'AI_GENERATED\')); END IF; END $$;',
    );
    await queryRunner.query(
      'DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = \'CHK_questions_quality_score\') THEN ALTER TABLE "questions" ADD CONSTRAINT "CHK_questions_quality_score" CHECK ("quality_score" BETWEEN 0 AND 100); END IF; END $$;',
    );
    await queryRunner.query(
      'DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = \'FK_questions_created_by_user\') THEN ALTER TABLE "questions" ADD CONSTRAINT "FK_questions_created_by_user" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL; END IF; END $$;',
    );
    await queryRunner.query(
      'DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = \'FK_questions_reviewed_by_user\') THEN ALTER TABLE "questions" ADD CONSTRAINT "FK_questions_reviewed_by_user" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL; END IF; END $$;',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_questions_published_scope" ON "questions" ("status", "subject", "chapter", "topic", "difficulty")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_questions_catalog_search" ON "questions" ("status", "subject", "chapter", "topic")',
    );

    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "practice_attempts" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "subject" varchar(100) NOT NULL, "chapter" varchar(160) NOT NULL, "topic" varchar(160) NOT NULL, "title" varchar(200) NOT NULL, "question_ids" jsonb NOT NULL, "status" varchar(20) NOT NULL DEFAULT \'IN_PROGRESS\', "total_questions" integer NOT NULL, "correct_count" integer NOT NULL DEFAULT 0, "score_percent" integer NOT NULL DEFAULT 0, "analysis" jsonb, "started_at" timestamp NOT NULL, "submitted_at" timestamp, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), CONSTRAINT "CHK_practice_attempt_status" CHECK ("status" IN (\'IN_PROGRESS\', \'SUBMITTED\')))',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_practice_attempts_user_status" ON "practice_attempts" ("user_id", "status")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_practice_attempts_scope" ON "practice_attempts" ("user_id", "subject", "chapter", "topic")',
    );
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "practice_answers" ("id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "attempt_id" uuid NOT NULL REFERENCES "practice_attempts"("id") ON DELETE CASCADE, "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE RESTRICT, "selected_option" text, "elapsed_seconds" integer, "is_correct" boolean, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), CONSTRAINT "UQ_practice_answers_attempt_question" UNIQUE ("attempt_id", "question_id"))',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_practice_answers_attempt" ON "practice_answers" ("attempt_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "practice_answers"');
    await queryRunner.query('DROP TABLE IF EXISTS "practice_attempts"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_questions_catalog_search"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_questions_published_scope"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "FK_questions_reviewed_by_user"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "FK_questions_created_by_user"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "CHK_questions_quality_score"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "CHK_questions_source"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "CHK_questions_status"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP COLUMN IF EXISTS "updated_at"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP COLUMN IF EXISTS "published_at"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP COLUMN IF EXISTS "review_notes"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP COLUMN IF EXISTS "reviewed_at"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP COLUMN IF EXISTS "reviewed_by_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP COLUMN IF EXISTS "created_by_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP COLUMN IF EXISTS "quality_score"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP COLUMN IF EXISTS "source"',
    );
    await queryRunner.query(
      'ALTER TABLE "questions" DROP COLUMN IF EXISTS "status"',
    );
  }
}
