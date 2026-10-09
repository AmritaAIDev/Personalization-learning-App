import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase C of the Study Plan & Progress UI plan (docs/STUDY-PLAN-UI-PLAN.md):
 * one plan per student and its dated tasks. New tables only, so it is safe to
 * apply while the previous release is serving.
 */
export class CreateStudyPlan1787000200000 implements MigrationInterface {
  name = 'CreateStudyPlan1787000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "study_plans" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "target_month" char(7) NOT NULL,
        "daily_minutes" integer NOT NULL,
        "pace_warning" boolean NOT NULL DEFAULT false,
        "required_minutes_per_day" integer NOT NULL DEFAULT 0,
        "generated_at" timestamp NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_study_plans_user" UNIQUE ("user_id"),
        CONSTRAINT "FK_study_plans_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "study_plan_tasks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "date" date NOT NULL,
        "subject" varchar(100) NOT NULL,
        "chapter" varchar(160) NOT NULL,
        "scope_chapter" varchar(160) NOT NULL,
        "topic" varchar(160) NOT NULL,
        "est_minutes" integer NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "status" varchar(12) NOT NULL DEFAULT 'PENDING',
        "completed_at" timestamp,
        "completion_source" varchar(10),
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_study_plan_tasks_topic"
          UNIQUE ("plan_id", "subject", "chapter", "topic"),
        CONSTRAINT "FK_study_plan_tasks_plan" FOREIGN KEY ("plan_id")
          REFERENCES "study_plans"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_study_plan_tasks_status"
          CHECK ("status" IN ('PENDING', 'COMPLETED', 'SKIPPED')),
        CONSTRAINT "CHK_study_plan_tasks_source"
          CHECK ("completion_source" IS NULL OR "completion_source" IN ('MANUAL', 'AUTO'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_study_plan_tasks_plan_date" ON "study_plan_tasks" ("plan_id", "date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_study_plan_tasks_plan_date"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "study_plan_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "study_plans"`);
  }
}
