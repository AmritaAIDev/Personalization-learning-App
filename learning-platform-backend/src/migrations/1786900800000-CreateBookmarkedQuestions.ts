import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3 of the jee-compass-inspired feature plan
 * (docs/JEE-COMPASS-INSPIRATION-PLAN.md): "save this question for later".
 * Keyed by (user_id, question_id) directly against the shared `questions`
 * table — see bookmarked-question.entity.ts for why no source column is
 * needed here.
 */
export class CreateBookmarkedQuestions1786900800000
  implements MigrationInterface
{
  name = 'CreateBookmarkedQuestions1786900800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bookmarked_questions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_bookmarked_questions_user_question"
          UNIQUE ("user_id", "question_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_bookmarked_questions_user" ON "bookmarked_questions" ("user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_bookmarked_questions_user"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "bookmarked_questions"');
  }
}
