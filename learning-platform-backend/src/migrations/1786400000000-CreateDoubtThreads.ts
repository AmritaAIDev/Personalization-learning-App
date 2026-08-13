import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoubtThreads1786400000000 implements MigrationInterface {
  name = 'CreateDoubtThreads1786400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doubt_threads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" character varying(120) NOT NULL,
        "subject" character varying(100) NOT NULL,
        "chapter" character varying(160) NOT NULL,
        "topic" character varying(160) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doubt_threads_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doubt_threads_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_doubt_threads_user_updated" ON "doubt_threads" ("user_id", "updated_at")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_doubt_threads_user_scope" ON "doubt_threads" ("user_id", "subject", "chapter", "topic")',
    );
    await queryRunner.query(
      'ALTER TABLE "doubts" ADD COLUMN IF NOT EXISTS "thread_id" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "doubts" ADD CONSTRAINT "FK_doubts_thread" FOREIGN KEY ("thread_id") REFERENCES "doubt_threads"("id") ON DELETE SET NULL',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_doubts_user_thread_created" ON "doubts" ("user_id", "thread_id", "created_at")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_doubts_user_thread_created"',
    );
    await queryRunner.query(
      'ALTER TABLE "doubts" DROP CONSTRAINT IF EXISTS "FK_doubts_thread"',
    );
    await queryRunner.query(
      'ALTER TABLE "doubts" DROP COLUMN IF EXISTS "thread_id"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_doubt_threads_user_scope"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_doubt_threads_user_updated"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "doubt_threads"');
  }
}
