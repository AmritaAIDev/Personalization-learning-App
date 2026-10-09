import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Database audit 2026-10-10, finding S7: eight nullable uuid reference
 * columns stored foreign-key-looking data with no foreign key at all —
 * orphans could accumulate silently. Every reference was checked for
 * orphans before this migration (see docs/DATABASE-AUDIT-2026-10.md):
 *
 *  - seven columns are clean → validated constraints added directly;
 *  - misconception_hits.last_question_id has 10 orphans (questions deleted
 *    or archived after a misconception was recorded) → added NOT VALID so
 *    the constraint governs all NEW writes without failing on historical
 *    rows. Re-validate later with:
 *      ALTER TABLE misconception_hits VALIDATE CONSTRAINT FK_misconception_hits_last_question;
 *
 * All columns are nullable, so ON DELETE SET NULL keeps the owning row
 * (the doubt message, the report, the hit) and drops only the dead
 * reference. ADD CONSTRAINT ... is instant except for the validation scan
 * on the small reference tables; safe for the deploy window.
 */
export class AddMissingForeignKeys1787000600000 implements MigrationInterface {
  name = 'AddMissingForeignKeys1787000600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doubts"
        ADD CONSTRAINT "FK_doubts_question_id"
        FOREIGN KEY ("question_id") REFERENCES "questions"("id")
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "doubts"
        ADD CONSTRAINT "FK_doubts_learning_session_id"
        FOREIGN KEY ("learning_session_id") REFERENCES "learning_sessions"("id")
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "doubts"
        ADD CONSTRAINT "FK_doubts_learning_session_item_id"
        FOREIGN KEY ("learning_session_item_id")
        REFERENCES "learning_session_items"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "doubts"
        ADD CONSTRAINT "FK_doubts_practice_attempt_id"
        FOREIGN KEY ("practice_attempt_id") REFERENCES "practice_attempts"("id")
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "question_reports"
        ADD CONSTRAINT "FK_question_reports_resolved_by"
        FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id")
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "targeted_practice_questions"
        ADD CONSTRAINT "FK_tp_questions_source_question"
        FOREIGN KEY ("source_question_id") REFERENCES "questions"("id")
        ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "notebook_mistake_reviews"
        ADD CONSTRAINT "FK_notebook_mistake_reviews_question"
        FOREIGN KEY ("question_id") REFERENCES "questions"("id")
        ON DELETE SET NULL
    `);
    // 10 historical orphans: govern new writes now, validate later.
    await queryRunner.query(`
      ALTER TABLE "misconception_hits"
        ADD CONSTRAINT "FK_misconception_hits_last_question"
        FOREIGN KEY ("last_question_id") REFERENCES "questions"("id")
        ON DELETE SET NULL NOT VALID
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "misconception_hits" DROP CONSTRAINT IF EXISTS "FK_misconception_hits_last_question"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notebook_mistake_reviews" DROP CONSTRAINT IF EXISTS "FK_notebook_mistake_reviews_question"`,
    );
    await queryRunner.query(
      `ALTER TABLE "targeted_practice_questions" DROP CONSTRAINT IF EXISTS "FK_tp_questions_source_question"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_reports" DROP CONSTRAINT IF EXISTS "FK_question_reports_resolved_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doubts" DROP CONSTRAINT IF EXISTS "FK_doubts_practice_attempt_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doubts" DROP CONSTRAINT IF EXISTS "FK_doubts_learning_session_item_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doubts" DROP CONSTRAINT IF EXISTS "FK_doubts_learning_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doubts" DROP CONSTRAINT IF EXISTS "FK_doubts_question_id"`,
    );
  }
}
