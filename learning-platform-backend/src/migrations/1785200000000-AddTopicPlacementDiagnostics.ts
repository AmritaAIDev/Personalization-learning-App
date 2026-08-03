import { MigrationInterface, QueryRunner } from 'typeorm';

/** Persists a diagnostic's scope so topic placement is auditable and repeatable. */
export class AddTopicPlacementDiagnostics1785200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "diagnostic_attempts" ADD COLUMN IF NOT EXISTS "mode" varchar(24) NOT NULL DEFAULT 'PROGRAM'`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnostic_attempts" ADD COLUMN IF NOT EXISTS "chapter" varchar(160)`,
    );
    await queryRunner.query(
      `ALTER TABLE "diagnostic_attempts" ADD COLUMN IF NOT EXISTS "topic" varchar(160)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_diagnostic_attempts_topic_scope" ON "diagnostic_attempts" ("user_id", "subject", "chapter", "topic", "mode")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_diagnostic_attempts_topic_scope"');
    await queryRunner.query('ALTER TABLE "diagnostic_attempts" DROP COLUMN IF EXISTS "topic"');
    await queryRunner.query('ALTER TABLE "diagnostic_attempts" DROP COLUMN IF EXISTS "chapter"');
    await queryRunner.query('ALTER TABLE "diagnostic_attempts" DROP COLUMN IF EXISTS "mode"');
  }
}
