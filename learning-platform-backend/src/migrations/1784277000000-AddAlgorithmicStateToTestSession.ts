import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlgorithmicStateToTestSession1784277000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "test_sessions"
            ADD COLUMN "current_taxonomy" integer NOT NULL DEFAULT 1,
            ADD COLUMN "current_difficulty" integer NOT NULL DEFAULT 1,
            ADD COLUMN "streak_counter" integer NOT NULL DEFAULT 0,
            ADD COLUMN "failed_attempts" integer NOT NULL DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "test_sessions"
            DROP COLUMN "current_taxonomy",
            DROP COLUMN "current_difficulty",
            DROP COLUMN "streak_counter",
            DROP COLUMN "failed_attempts"
        `);
    }

}
