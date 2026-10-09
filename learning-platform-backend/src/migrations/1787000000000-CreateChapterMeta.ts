import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 1 of the JEE Compass adoption plan
 * (docs/JEE-COMPASS-ADOPTION-PLAN.md): per-chapter study-guide metadata
 * (overview, objectives, key formulas, difficulty, study time) and the
 * unit grouping used by the subject page. One row per CHAPTER-level topic.
 */
export class CreateChapterMeta1787000000000 implements MigrationInterface {
  name = 'CreateChapterMeta1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "chapter_meta_difficulty_enum" AS ENUM ('Easy', 'Medium', 'Hard')`,
    );
    await queryRunner.query(
      `CREATE TYPE "chapter_meta_source_enum" AS ENUM ('COMPASS_IMPORT', 'AI_DRAFT', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "chapter_meta_status_enum" AS ENUM ('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "chapter_meta" (
        "topic_id" uuid PRIMARY KEY REFERENCES "topics"("id") ON DELETE CASCADE,
        "unit" varchar(60),
        "overview" text,
        "objectives" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "key_formulas" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "difficulty" "chapter_meta_difficulty_enum",
        "study_minutes" integer,
        "jee_weightage_note" varchar(120),
        "source" "chapter_meta_source_enum" NOT NULL DEFAULT 'AI_DRAFT',
        "status" "chapter_meta_status_enum" NOT NULL DEFAULT 'DRAFT',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_chapter_meta_status" ON "chapter_meta" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chapter_meta_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chapter_meta"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "chapter_meta_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "chapter_meta_source_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "chapter_meta_difficulty_enum"`,
    );
  }
}
