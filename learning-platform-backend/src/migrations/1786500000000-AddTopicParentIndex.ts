import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `topics.parent_id` has an FK (ON DELETE CASCADE) but Postgres never
 * auto-indexes the referencing side of a foreign key. Every parent-topic
 * delete has to scan the whole table to find its children, and the
 * `relations: { parent: true }` / `{ children: true }` eager loads used by
 * TopicsService and AdaptiveService's cached topic-graph lookup join on this
 * column too.
 */
export class AddTopicParentIndex1786500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_topics_parent_id" ON "topics" ("parent_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_topics_parent_id"');
  }
}
