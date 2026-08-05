import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Captures a learner's pre-answer self-rated confidence (1–3) on both practice
 * and diagnostic answers. Nullable so historical rows and skipped ratings stay
 * valid; it powers over/under-confidence calibration on the review screens.
 */
export class AddAnswerConfidence1785400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "practice_answers" ADD COLUMN IF NOT EXISTS "confidence" smallint`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnostic_answers" ADD COLUMN IF NOT EXISTS "confidence" smallint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "diagnostic_answers" DROP COLUMN IF EXISTS "confidence"',
    );
    await queryRunner.query(
      'ALTER TABLE "practice_answers" DROP COLUMN IF EXISTS "confidence"',
    );
  }
}
