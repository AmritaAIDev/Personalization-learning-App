import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Upgrades flashcard scheduling from a fixed-multiplier heuristic to real
 * SM-2: an ease factor per card that tightens on repeated HARD/AGAIN ratings
 * and loosens on repeated EASY ratings, instead of every card in the same
 * repetition count growing its interval by the same fixed step regardless of
 * review history. Default 2.5 is SM-2's standard starting ease; existing
 * rows (reviewed under the old scheme) start neutral rather than being
 * back-dated with a guessed history.
 */
export class AddFlashcardEaseFactor1786800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flashcard_reviews" ADD COLUMN IF NOT EXISTS "ease_factor" real NOT NULL DEFAULT 2.5`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "flashcard_reviews" DROP COLUMN IF EXISTS "ease_factor"',
    );
  }
}
