import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTopicPrerequisites1784226308762 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "topic_prerequisites" (
                "topic_id" uuid NOT NULL,
                "prerequisite_id" uuid NOT NULL,
                CONSTRAINT "PK_topic_prereq" PRIMARY KEY ("topic_id", "prerequisite_id"),
                CONSTRAINT "FK_topic_prereq_topic" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_topic_prereq_prerequisite" FOREIGN KEY ("prerequisite_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "topic_prerequisites"`);
  }
}
