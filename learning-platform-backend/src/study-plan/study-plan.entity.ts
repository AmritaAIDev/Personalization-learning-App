import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/**
 * One study plan per student (rebuilding replaces the not-yet-done tasks of the
 * same row, so completed history is kept). Whether the plan is out of date is
 * derived, not stored: it is stale when the student's target month or daily
 * budget no longer match the ones it was generated for.
 */
@Entity('study_plans')
@Unique('UQ_study_plans_user', ['userId'])
export class StudyPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** `YYYY-MM` the plan was generated for. */
  @Column({ name: 'target_month', type: 'char', length: 7 })
  targetMonth: string;

  @Column({ name: 'daily_minutes', type: 'int' })
  dailyMinutes: number;

  /** The work did not fit the daily budget before the deadline. */
  @Column({ name: 'pace_warning', type: 'boolean', default: false })
  paceWarning: boolean;

  /** Minutes a day that would fit everything (a multiple of 5); 0 if nothing was planned. */
  @Column({ name: 'required_minutes_per_day', type: 'int', default: 0 })
  requiredMinutesPerDay: number;

  @Column({ name: 'generated_at', type: 'timestamp' })
  generatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export enum StudyTaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export enum StudyTaskCompletionSource {
  /** The student ticked it. Never changes topic mastery. */
  MANUAL = 'MANUAL',
  /** The topic became Completed through the student's real answers. */
  AUTO = 'AUTO',
}

/**
 * One topic scheduled on one day. Keyed by names (not a foreign key to
 * `topics`) because a chapter's topics can come from the curriculum tree or
 * from its published questions, and `scope_chapter` records the chapter name
 * the questions are tagged with, which is what /learn needs. "Overdue" is
 * derived (PENDING and the date has passed), never stored.
 */
@Entity('study_plan_tasks')
@Unique('UQ_study_plan_tasks_topic', ['planId', 'subject', 'chapter', 'topic'])
@Index('IDX_study_plan_tasks_plan_date', ['planId', 'date'])
export class StudyPlanTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => StudyPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: StudyPlan;

  /** `YYYY-MM-DD`; a plain calendar date with no time zone. */
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 160 })
  chapter: string;

  @Column({ name: 'scope_chapter', type: 'varchar', length: 160 })
  scopeChapter: string;

  @Column({ type: 'varchar', length: 160 })
  topic: string;

  @Column({ name: 'est_minutes', type: 'int' })
  estMinutes: number;

  /** Order within the plan (syllabus order), so a day's tasks list stably. */
  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({
    type: 'varchar',
    length: 12,
    default: StudyTaskStatus.PENDING,
  })
  status: StudyTaskStatus;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({
    name: 'completion_source',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  completionSource: StudyTaskCompletionSource | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
