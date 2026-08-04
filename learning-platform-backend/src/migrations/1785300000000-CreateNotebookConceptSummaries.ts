import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Durable cache for the LLM-generated concept summaries shown in the notebook.
 * See NotebookConceptSummary entity for the invalidation strategy.
 */
export class CreateNotebookConceptSummaries1785300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notebook_concept_summaries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "subject" varchar(160) NOT NULL,
        "chapter" varchar(200) NOT NULL,
        "topic" varchar(200) NOT NULL,
        "concept_label" varchar(240) NOT NULL,
        "misconception_summary" text NOT NULL,
        "source_hash" varchar(64) NOT NULL,
        "summary_source" varchar(12) NOT NULL DEFAULT 'FALLBACK',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_notebook_concept_user_topic"
      ON "notebook_concept_summaries" ("user_id", "subject", "topic")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notebook_concept_summaries_user"
      ON "notebook_concept_summaries" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_notebook_concept_summaries_user"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_notebook_concept_user_topic"',
    );
    await queryRunner.query(
      'DROP TABLE IF EXISTS "notebook_concept_summaries"',
    );
  }
}
