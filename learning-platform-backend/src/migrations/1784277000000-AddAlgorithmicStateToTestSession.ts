import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlgorithmicStateToTestSession1784277000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "test_sessions"
            ADD COLUMN IF NOT EXISTS "current_taxonomy" integer NOT NULL DEFAULT 1,
            ADD COLUMN IF NOT EXISTS "current_difficulty" integer NOT NULL DEFAULT 1,
            ADD COLUMN IF NOT EXISTS "streak_counter" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "failed_attempts" integer NOT NULL DEFAULT 0
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "test_sessions"
            DROP COLUMN IF EXISTS "current_taxonomy",
            DROP COLUMN IF EXISTS "current_difficulty",
            DROP COLUMN IF EXISTS "streak_counter",
            DROP COLUMN IF EXISTS "failed_attempts"
        `);
  }
}
