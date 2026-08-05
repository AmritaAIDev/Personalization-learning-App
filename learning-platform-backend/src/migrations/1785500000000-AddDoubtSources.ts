import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stores the reviewed concept notes (title/topic/chapter) that a doubt's answer
 * was grounded on, so RAG citations can render under the answer. Nullable:
 * doubts answered before citations, or with nothing to cite, simply have none.
 */
export class AddDoubtSources1785500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "doubts" ADD COLUMN IF NOT EXISTS "sources" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "doubts" DROP COLUMN IF EXISTS "sources"',
    );
  }
}
