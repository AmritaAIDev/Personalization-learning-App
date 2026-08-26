import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A doubt answered while the AI tutor was unreachable was indistinguishable
 * from a real answer — both landed as status ANSWERED, so the UI badged a
 * deterministic fallback as if the tutor had genuinely responded. This flag
 * lets the client show that distinction.
 */
export class AddDoubtAnsweredWithFallback1786900500000 implements MigrationInterface {
  name = 'AddDoubtAnsweredWithFallback1786900500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doubts"
      ADD COLUMN IF NOT EXISTS "answered_with_fallback" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "doubts" DROP COLUMN IF EXISTS "answered_with_fallback"
    `);
  }
}
