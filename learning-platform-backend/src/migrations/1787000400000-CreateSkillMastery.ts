import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Knowledge tracing (AI roadmap): a derived per-learner × per-skill BKT
 * snapshot. Additive only — no existing table is touched, and the whole
 * table is recomputable from graded answer events at any time, so `down()`
 * dropping it loses nothing authoritative.
 */
export class CreateSkillMastery1787000400000 implements MigrationInterface {
  name = 'CreateSkillMastery1787000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "skill_mastery" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" varchar(100) NOT NULL,
        "chapter" varchar(160) NOT NULL,
        "topic" varchar(160) NOT NULL,
        "p_know" numeric(4,3) NOT NULL DEFAULT 0,
        "attempts" integer NOT NULL DEFAULT 0,
        "correct" integer NOT NULL DEFAULT 0,
        "last_traced_at" timestamp,
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_skill_mastery_user_skill" ON "skill_mastery" ("user_id", "subject", "chapter", "topic")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_skill_mastery_user_pknow" ON "skill_mastery" ("user_id", "p_know")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_skill_mastery_user_pknow"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "skill_mastery"`);
  }
}
