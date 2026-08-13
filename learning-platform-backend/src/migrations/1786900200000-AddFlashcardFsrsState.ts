import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Upgrades flashcard scheduling from SM-2's single ease factor to FSRS-6's
 * two-parameter memory model (difficulty, stability) — see fsrs.util.ts.
 * `ease_factor` was only introduced this cycle (1786800000000) and is fully
 * superseded, so it is dropped rather than kept as a dead column. Existing
 * rows start at FSRS's neutral defaults (D=5 mid-scale, S=1 day) rather than
 * being back-dated with a guessed history.
 */
export class AddFlashcardFsrsState1786900200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flashcard_reviews" ADD COLUMN IF NOT EXISTS "difficulty" real NOT NULL DEFAULT 5`,
    );
    await queryRunner.query(
      `ALTER TABLE "flashcard_reviews" ADD COLUMN IF NOT EXISTS "stability" real NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      'ALTER TABLE "flashcard_reviews" DROP COLUMN IF EXISTS "ease_factor"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flashcard_reviews" ADD COLUMN IF NOT EXISTS "ease_factor" real NOT NULL DEFAULT 2.5`,
    );
    await queryRunner.query(
      'ALTER TABLE "flashcard_reviews" DROP COLUMN IF EXISTS "stability"',
    );
    await queryRunner.query(
      'ALTER TABLE "flashcard_reviews" DROP COLUMN IF EXISTS "difficulty"',
    );
  }
}
