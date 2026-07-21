import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema for fresh installations. Existing synchronized databases can
 * safely adopt this migration because every creation statement is idempotent.
 */
export class InitialLearningPlatformSchema1784000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "topics_level_enum" AS ENUM ('SUBJECT', 'CHAPTER', 'SUB_TOPIC', 'CONCEPT');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "email" varchar NOT NULL UNIQUE,
        "passwordHash" varchar NOT NULL,
        "role" varchar NOT NULL DEFAULT 'student',
        "xp" integer NOT NULL DEFAULT 0,
        "level" integer NOT NULL DEFAULT 1,
        "streak" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "topics" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "description" text,
        "level" "topics_level_enum" NOT NULL DEFAULT 'SUBJECT',
        "parent_id" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_topics_parent'
        ) THEN
          ALTER TABLE "topics"
            ADD CONSTRAINT "FK_topics_parent"
            FOREIGN KEY ("parent_id") REFERENCES "topics"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "questions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "question_id" varchar NOT NULL UNIQUE,
        "subject" varchar NOT NULL,
        "chapter" varchar NOT NULL,
        "topic" varchar NOT NULL,
        "subtopic" varchar,
        "question_text" text NOT NULL,
        "options" jsonb NOT NULL,
        "correct_answer" varchar NOT NULL,
        "solution" text NOT NULL,
        "bloom_level" varchar(50) NOT NULL,
        "difficulty" varchar(50) NOT NULL,
        "marks" integer NOT NULL,
        "estimated_time_sec" integer NOT NULL,
        "concept_tags" jsonb NOT NULL,
        "common_errors" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "test_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "topic_id" uuid NOT NULL,
        "status" varchar NOT NULL DEFAULT 'in-progress',
        "currentScore" integer NOT NULL DEFAULT 0,
        "startedAt" timestamp NOT NULL DEFAULT now(),
        "endedAt" timestamp,
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_test_sessions_user') THEN
          ALTER TABLE "test_sessions"
            ADD CONSTRAINT "FK_test_sessions_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_test_sessions_topic') THEN
          ALTER TABLE "test_sessions"
            ADD CONSTRAINT "FK_test_sessions_topic"
            FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "test_sessions" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "questions" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "topics" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "users" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "topics_level_enum"');
  }
}
