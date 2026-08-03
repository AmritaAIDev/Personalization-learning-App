import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import type { DiagnosticAnalysis } from './diagnostic.types';
import { DiagnosticAttemptMode, DiagnosticAttemptStatus } from './diagnostic.types';
import { DiagnosticAnswer } from './diagnostic-answer.entity';

/**
 * An immutable diagnostic question set owned by one authenticated student.
 * Correct answers remain in the question bank and are never sent before submit.
 */
@Entity('diagnostic_attempts')
@Index('IDX_diagnostic_attempts_user_status', ['userId', 'status'])
export class DiagnosticAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 24, default: DiagnosticAttemptMode.PROGRAM })
  mode: DiagnosticAttemptMode;

  @Column({ type: 'varchar', length: 160, nullable: true })
  chapter: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  topic: string | null;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ name: 'chapter_scope', type: 'jsonb' })
  chapterScope: string[];

  @Column({ name: 'question_ids', type: 'jsonb' })
  questionIds: string[];

  @Column({
    type: 'varchar',
    length: 20,
    default: DiagnosticAttemptStatus.IN_PROGRESS,
  })
  status: DiagnosticAttemptStatus;

  @Column({ name: 'total_questions', type: 'int' })
  totalQuestions: number;

  @Column({ name: 'correct_count', type: 'int', default: 0 })
  correctCount: number;

  @Column({ name: 'score_percent', type: 'int', default: 0 })
  scorePercent: number;

  @Column({ type: 'jsonb', nullable: true })
  analysis: DiagnosticAnalysis | null;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @OneToMany(() => DiagnosticAnswer, (answer) => answer.attempt)
  answers: DiagnosticAnswer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
