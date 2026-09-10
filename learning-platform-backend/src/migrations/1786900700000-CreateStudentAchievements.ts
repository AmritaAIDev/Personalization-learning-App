import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Permanent record of earned achievements/badges (Phase 2 of the
 * jee-compass-inspired feature plan — see docs/JEE-COMPASS-INSPIRATION-PLAN.md).
 * Conditions are evaluated server-side against real attempt/XP/streak data
 * (see achievements/achievement-definition.ts) and, once met, persisted here
 * so a badge stays earned even if the underlying stat later dips.
 */
export class CreateStudentAchievements1786900700000
  implements MigrationInterface
{
  name = 'CreateStudentAchievements1786900700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_achievements" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "achievement_key" varchar(40) NOT NULL,
        "earned_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_student_achievements_user_key"
          UNIQUE ("user_id", "achievement_key")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_student_achievements_user" ON "student_achievements" ("user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_student_achievements_user"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "student_achievements"');
  }
}
