import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Database audit 2026-10-10 (docs/DATABASE-AUDIT-2026-10.md), finding S4:
 * the initial prototype shipped quoted camelCase columns while every newer
 * table uses snake_case. This migration normalises the remaining legacy
 * offenders so the whole schema follows one naming convention.
 *
 * Data-safe: RENAME COLUMN never touches row content. The TypeScript entity
 * properties keep their camelCase names (API JSON is unchanged); only the
 * physical column names move. No service-level raw SQL referenced the old
 * quoted names (verified by search at audit time).
 *
 * Compatibility note: deploy this with the matching entity change in the
 * same release — the old code expects the old names, the new code the new
 * ones (rename is instant, so the deploy window is a single restart).
 */
export class RenameLegacyColumnsToSnakeCase1787000500000 implements MigrationInterface {
  name = 'RenameLegacyColumnsToSnakeCase1787000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "topics" RENAME COLUMN "createdAt" TO "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "topics" RENAME COLUMN "updatedAt" TO "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_sessions" RENAME COLUMN "currentScore" TO "current_score"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_sessions" RENAME COLUMN "startedAt" TO "started_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_sessions" RENAME COLUMN "endedAt" TO "ended_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_sessions" RENAME COLUMN "updatedAt" TO "updated_at"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "test_sessions" RENAME COLUMN "updated_at" TO "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_sessions" RENAME COLUMN "ended_at" TO "endedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_sessions" RENAME COLUMN "started_at" TO "startedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_sessions" RENAME COLUMN "current_score" TO "currentScore"`,
    );
    await queryRunner.query(
      `ALTER TABLE "topics" RENAME COLUMN "updated_at" TO "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "topics" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "updated_at" TO "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "password_hash" TO "passwordHash"`,
    );
  }
}
