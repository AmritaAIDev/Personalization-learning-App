import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeLearningQuestionRepeatChecks1784600000000 implements MigrationInterface {
  name = 'OptimizeLearningQuestionRepeatChecks1784600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_learning_sessions_user_scope_coordinate" ON "learning_sessions" ("user_id", "subject", "chapter", "topic", "bloom_level", "difficulty")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_learning_sessions_user_scope_coordinate"',
    );
  }
}
