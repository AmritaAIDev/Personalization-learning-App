import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase A of the Study Plan & Progress UI plan (docs/STUDY-PLAN-UI-PLAN.md):
 * the student's personalisation profile (class, stream, target month, daily
 * study budget) and the class a chapter belongs to. Every column is nullable or
 * has a default, so it is safe to apply while the previous release is serving.
 */
export class AddPersonalization1787000100000 implements MigrationInterface {
  name = 'AddPersonalization1787000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "class_name" varchar(20),
        ADD COLUMN IF NOT EXISTS "stream" varchar(30),
        ADD COLUMN IF NOT EXISTS "target_month" char(7),
        ADD COLUMN IF NOT EXISTS "daily_minutes" integer NOT NULL DEFAULT 120,
        ADD COLUMN IF NOT EXISTS "personalization_completed_at" timestamp
    `);
    await queryRunner.query(`
      ALTER TABLE "chapter_meta"
        ADD COLUMN IF NOT EXISTS "class_level" smallint
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chapter_meta" DROP COLUMN IF EXISTS "class_level"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "personalization_completed_at",
        DROP COLUMN IF EXISTS "daily_minutes",
        DROP COLUMN IF EXISTS "target_month",
        DROP COLUMN IF EXISTS "stream",
        DROP COLUMN IF EXISTS "class_name"
    `);
  }
}
