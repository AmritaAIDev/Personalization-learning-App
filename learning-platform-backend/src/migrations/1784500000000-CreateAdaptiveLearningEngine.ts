import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Durable state for the five-Bloom-by-three-difficulty adaptive journey,
 * learner-private AI caches, SRS flashcards, and persisted tutor messages.
 */
export class CreateAdaptiveLearningEngine1784500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_topic_states" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" varchar(100) NOT NULL,
        "chapter" varchar(160) NOT NULL,
        "topic" varchar(160) NOT NULL,
        "current_level" smallint NOT NULL DEFAULT 1,
        "status" varchar(32) NOT NULL DEFAULT 'ACTIVE',
        "streak_counter" smallint NOT NULL DEFAULT 0,
        "total_answered" integer NOT NULL DEFAULT 0,
        "total_correct" integer NOT NULL DEFAULT 0,
        "last_activity_at" timestamp NOT NULL DEFAULT now(),
        "mastered_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_learning_topic_states_scope" UNIQUE ("user_id", "subject", "chapter", "topic"),
        CONSTRAINT "CHK_learning_topic_states_level" CHECK ("current_level" BETWEEN 1 AND 15),
        CONSTRAINT "CHK_learning_topic_states_status" CHECK ("status" IN ('ACTIVE', 'MASTERED', 'PAUSED_FOR_PREREQUISITE')),
        CONSTRAINT "CHK_learning_topic_states_counts" CHECK ("total_answered" >= "total_correct" AND "total_correct" >= 0)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_topic_states_user_activity" ON "learning_topic_states" ("user_id", "last_activity_at" DESC)',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_generation_jobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" varchar(100) NOT NULL,
        "chapter" varchar(160) NOT NULL,
        "topic" varchar(160) NOT NULL,
        "target_level" smallint NOT NULL,
        "bloom_level" varchar(50) NOT NULL,
        "difficulty" varchar(50) NOT NULL,
        "requested_count" smallint NOT NULL,
        "generated_count" smallint NOT NULL DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "attempt_count" smallint NOT NULL DEFAULT 0,
        "last_error" varchar(500),
        "run_after" timestamp NOT NULL DEFAULT now(),
        "locked_at" timestamp,
        "completed_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_learning_generation_jobs_level" CHECK ("target_level" BETWEEN 1 AND 15),
        CONSTRAINT "CHK_learning_generation_jobs_count" CHECK ("requested_count" BETWEEN 1 AND 10 AND "generated_count" >= 0),
        CONSTRAINT "CHK_learning_generation_jobs_status" CHECK ("status" IN ('PENDING', 'PROCESSING', 'COMPLETED', 'RETRYING', 'FAILED'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_generation_jobs_queue" ON "learning_generation_jobs" ("status", "run_after")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_generation_jobs_scope" ON "learning_generation_jobs" ("user_id", "subject", "chapter", "topic", "target_level")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_generated_questions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "generation_job_id" uuid REFERENCES "learning_generation_jobs"("id") ON DELETE SET NULL,
        "subject" varchar(100) NOT NULL,
        "chapter" varchar(160) NOT NULL,
        "topic" varchar(160) NOT NULL,
        "bloom_level" varchar(50) NOT NULL,
        "difficulty" varchar(50) NOT NULL,
        "question_text" text NOT NULL,
        "options" jsonb NOT NULL,
        "correct_answer" text NOT NULL,
        "solution" text NOT NULL,
        "hint" text NOT NULL,
        "concept_tags" jsonb NOT NULL,
        "common_errors" jsonb NOT NULL,
        "source" varchar(20) NOT NULL DEFAULT 'AI_POOL',
        "status" varchar(20) NOT NULL DEFAULT 'READY',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_learning_generated_questions_source" CHECK ("source" IN ('CURATED', 'AI_POOL')),
        CONSTRAINT "CHK_learning_generated_questions_status" CHECK ("status" IN ('READY', 'RESERVED', 'REJECTED'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_generated_questions_pool" ON "learning_generated_questions" ("user_id", "subject", "chapter", "topic", "bloom_level", "difficulty", "status")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "state_id" uuid NOT NULL REFERENCES "learning_topic_states"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" varchar(100) NOT NULL,
        "chapter" varchar(160) NOT NULL,
        "topic" varchar(160) NOT NULL,
        "level" smallint NOT NULL,
        "bloom_level" varchar(50) NOT NULL,
        "difficulty" varchar(50) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'ACTIVE',
        "transition" varchar(20) NOT NULL DEFAULT 'NONE',
        "total_questions" smallint NOT NULL DEFAULT 5,
        "current_sequence" smallint NOT NULL DEFAULT 1,
        "completed_at" timestamp,
        "started_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_learning_sessions_level" CHECK ("level" BETWEEN 1 AND 15),
        CONSTRAINT "CHK_learning_sessions_status" CHECK ("status" IN ('ACTIVE', 'COMPLETED', 'ROUTED')),
        CONSTRAINT "CHK_learning_sessions_transition" CHECK ("transition" IN ('NONE', 'ADVANCED', 'REINFORCE', 'DEMOTED', 'PREREQUISITE', 'MASTERED')),
        CONSTRAINT "CHK_learning_sessions_question_counts" CHECK ("total_questions" BETWEEN 1 AND 10 AND "current_sequence" >= 1)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_sessions_user_status" ON "learning_sessions" ("user_id", "status")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_sessions_state_status" ON "learning_sessions" ("state_id", "status")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_session_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL REFERENCES "learning_sessions"("id") ON DELETE CASCADE,
        "sequence" smallint NOT NULL,
        "source" varchar(20) NOT NULL,
        "question_id" uuid REFERENCES "questions"("id") ON DELETE RESTRICT,
        "generated_question_id" uuid REFERENCES "learning_generated_questions"("id") ON DELETE RESTRICT,
        "resolved_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_learning_session_item_sequence" UNIQUE ("session_id", "sequence"),
        CONSTRAINT "CHK_learning_session_items_source" CHECK ("source" IN ('CURATED', 'AI_POOL')),
        CONSTRAINT "CHK_learning_session_items_reference" CHECK (("source" = 'CURATED' AND "question_id" IS NOT NULL AND "generated_question_id" IS NULL) OR ("source" = 'AI_POOL' AND "question_id" IS NULL AND "generated_question_id" IS NOT NULL))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_session_items_session" ON "learning_session_items" ("session_id", "sequence")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "learning_answers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "session_item_id" uuid NOT NULL REFERENCES "learning_session_items"("id") ON DELETE CASCADE,
        "attempt_number" smallint NOT NULL,
        "selected_option" text NOT NULL,
        "is_correct" boolean NOT NULL,
        "elapsed_seconds" integer,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_learning_answers_item_attempt" UNIQUE ("session_item_id", "attempt_number"),
        CONSTRAINT "CHK_learning_answers_attempt" CHECK ("attempt_number" BETWEEN 1 AND 2),
        CONSTRAINT "CHK_learning_answers_elapsed" CHECK ("elapsed_seconds" IS NULL OR "elapsed_seconds" >= 0)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_answers_item" ON "learning_answers" ("session_item_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flashcards" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "subject" varchar(100) NOT NULL,
        "chapter" varchar(160) NOT NULL,
        "topic" varchar(160) NOT NULL,
        "front" text NOT NULL,
        "back" text NOT NULL,
        "hint" text,
        "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "source" varchar(20) NOT NULL DEFAULT 'CURATED',
        "status" varchar(20) NOT NULL DEFAULT 'PUBLISHED',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_flashcards_source" CHECK ("source" IN ('CURATED', 'AI_GENERATED')),
        CONSTRAINT "CHK_flashcards_status" CHECK ("status" IN ('PUBLISHED', 'ARCHIVED'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_flashcards_scope" ON "flashcards" ("status", "subject", "chapter", "topic")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flashcard_reviews" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "flashcard_id" uuid NOT NULL REFERENCES "flashcards"("id") ON DELETE CASCADE,
        "last_rating" varchar(10) NOT NULL,
        "repetitions" smallint NOT NULL DEFAULT 0,
        "interval_days" smallint NOT NULL DEFAULT 0,
        "due_at" timestamp NOT NULL,
        "last_reviewed_at" timestamp NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_flashcard_reviews_user_card" UNIQUE ("user_id", "flashcard_id"),
        CONSTRAINT "CHK_flashcard_reviews_rating" CHECK ("last_rating" IN ('AGAIN', 'HARD', 'GOOD', 'EASY')),
        CONSTRAINT "CHK_flashcard_reviews_nonnegative" CHECK ("repetitions" >= 0 AND "interval_days" >= 0)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_flashcard_reviews_due" ON "flashcard_reviews" ("user_id", "due_at")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tutor_conversations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "session_id" uuid NOT NULL REFERENCES "learning_sessions"("id") ON DELETE CASCADE,
        "subject" varchar(100) NOT NULL,
        "chapter" varchar(160) NOT NULL,
        "topic" varchar(160) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tutor_conversations_session" UNIQUE ("user_id", "session_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_tutor_conversations_user_updated" ON "tutor_conversations" ("user_id", "updated_at" DESC)',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tutor_messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL REFERENCES "tutor_conversations"("id") ON DELETE CASCADE,
        "role" varchar(20) NOT NULL,
        "message_type" varchar(32) NOT NULL,
        "content" text NOT NULL,
        "related_session_item_id" uuid REFERENCES "learning_session_items"("id") ON DELETE SET NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_tutor_messages_role" CHECK ("role" IN ('USER', 'ASSISTANT')),
        CONSTRAINT "CHK_tutor_messages_type" CHECK ("message_type" IN ('GENERAL', 'SOCRATIC_HINT', 'ANSWER_EXPLANATION'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_tutor_messages_conversation_created" ON "tutor_messages" ("conversation_id", "created_at")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "tutor_messages"');
    await queryRunner.query('DROP TABLE IF EXISTS "tutor_conversations"');
    await queryRunner.query('DROP TABLE IF EXISTS "flashcard_reviews"');
    await queryRunner.query('DROP TABLE IF EXISTS "flashcards"');
    await queryRunner.query('DROP TABLE IF EXISTS "learning_answers"');
    await queryRunner.query('DROP TABLE IF EXISTS "learning_session_items"');
    await queryRunner.query('DROP TABLE IF EXISTS "learning_sessions"');
    await queryRunner.query(
      'DROP TABLE IF EXISTS "learning_generated_questions"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "learning_generation_jobs"');
    await queryRunner.query('DROP TABLE IF EXISTS "learning_topic_states"');
  }
}
