import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * On-demand single-question generations (AI Phase 2.2 "practice this
 * misconception" and 2.3 "try a similar one"). Deliberately outside the
 * adaptive session/state-machine tables: each row is answered once,
 * standalone, and never advances a learning level.
 */
export class CreateTargetedPracticeQuestions1786900100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "targeted_practice_questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" varchar(160) NOT NULL,
        "chapter" varchar(200) NOT NULL,
        "topic" varchar(200) NOT NULL,
        "reason" varchar(20) NOT NULL,
        "focus_text" text NOT NULL,
        "focus_hash" varchar(40) NOT NULL,
        "source_question_id" uuid,
        "question_text" text NOT NULL,
        "options" jsonb NOT NULL,
        "correct_answer" text NOT NULL,
        "solution" text NOT NULL,
        "hint" text NOT NULL,
        "concept_tags" jsonb NOT NULL,
        "bloom_level" varchar(50) NOT NULL,
        "difficulty" varchar(50) NOT NULL,
        "selected_option" text,
        "is_correct" boolean,
        "answered_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_targeted_practice_questions_lookup"
      ON "targeted_practice_questions" ("user_id", "subject", "topic", "reason", "focus_hash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS "targeted_practice_questions"',
    );
  }
}
