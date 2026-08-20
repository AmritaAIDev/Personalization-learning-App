import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Real per-mistake spaced-repetition schedule for the Notebook feature.
 * Additive only — Notebook's dueReviewAt/reviewState already existed as a
 * fixed 24h-after-occurrence fallback (notebook.service.ts's
 * getDueReviewAt()); this table lets a rated mistake get a real FSRS-driven
 * due date instead, while unrated mistakes keep using that same fallback.
 */
export class CreateNotebookMistakeReviews1786900300000 implements MigrationInterface {
  name = 'CreateNotebookMistakeReviews1786900300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notebook_mistake_reviews" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "source" varchar(12) NOT NULL,
        "question_id" uuid NOT NULL,
        "last_rating" varchar(10) NOT NULL,
        "repetitions" smallint NOT NULL DEFAULT 0,
        "interval_days" smallint NOT NULL DEFAULT 0,
        "difficulty" real NOT NULL DEFAULT 5,
        "stability" real NOT NULL DEFAULT 1,
        "due_at" timestamp NOT NULL,
        "last_reviewed_at" timestamp NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_notebook_mistake_reviews_user_source_question"
          UNIQUE ("user_id", "source", "question_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_notebook_mistake_reviews_due" ON "notebook_mistake_reviews" ("user_id", "due_at")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_notebook_mistake_reviews_due"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "notebook_mistake_reviews"');
  }
}
