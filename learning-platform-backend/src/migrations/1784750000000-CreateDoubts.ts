import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoubts1784750000000 implements MigrationInterface {
  name = 'CreateDoubts1784750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doubts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "subject" character varying(100) NOT NULL,
        "chapter" character varying(160) NOT NULL,
        "topic" character varying(160) NOT NULL,
        "message" text NOT NULL,
        "question_id" uuid,
        "learning_session_id" uuid,
        "learning_session_item_id" uuid,
        "practice_attempt_id" uuid,
        "notebook_card_id" character varying(120),
        "assistant_response" text,
        "status" character varying(20) NOT NULL DEFAULT 'OPEN',
        "answered_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doubts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doubts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_doubts_user_created" ON "doubts" ("user_id", "created_at")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_doubts_user_scope" ON "doubts" ("user_id", "subject", "chapter", "topic")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_doubts_user_scope"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_doubts_user_created"');
    await queryRunner.query('DROP TABLE IF EXISTS "doubts"');
  }
}
