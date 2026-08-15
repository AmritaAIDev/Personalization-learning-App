import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-user misconception tally (AI Phase 2.2). Each row is a distinct
 * misconception (hashed for the unique key, since the text itself can be
 * long) with a running hit count, so the notebook can surface the dominant
 * recurring gap for a topic instead of just the first common_errors entry.
 */
export class CreateMisconceptionHits1786900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "misconception_hits" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" varchar(160) NOT NULL,
        "chapter" varchar(200) NOT NULL,
        "topic" varchar(200) NOT NULL,
        "misconception" text NOT NULL,
        "misconception_hash" varchar(40) NOT NULL,
        "hit_count" integer NOT NULL DEFAULT 1,
        "source" varchar(12) NOT NULL,
        "last_question_id" uuid,
        "first_occurred_at" timestamp NOT NULL DEFAULT now(),
        "last_occurred_at" timestamp NOT NULL DEFAULT now(),
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_misconception_hits_user_hash"
      ON "misconception_hits" ("user_id", "misconception_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_misconception_hits_user_topic"
      ON "misconception_hits" ("user_id", "subject", "topic")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "misconception_hits"');
  }
}
