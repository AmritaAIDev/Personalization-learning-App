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
import {
  MockTestAttemptStatus,
  type DifficultyCount,
  type SubjectBreakdown,
  type SubjectCount,
} from './mock-test.types';
import { MockTestAnswer } from './mock-test-answer.entity';

/**
 * A full-length, multi-subject mock exam: a fixed question set drawn once at
 * start time (never re-rolled), scored with JEE's +4/-1 negative-marking
 * scheme on submit. `percentile` is computed against every other submitted
 * attempt on this platform, not the real national JEE cohort — the review
 * UI is worded accordingly.
 */
@Entity('mock_test_attempts')
@Index('IDX_mock_test_attempts_user_status', ['userId', 'status'])
export class MockTestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: MockTestAttemptStatus.IN_PROGRESS,
  })
  status: MockTestAttemptStatus;

  @Column({ name: 'question_ids', type: 'jsonb' })
  questionIds: string[];

  @Column({ name: 'total_questions', type: 'int' })
  totalQuestions: number;

  @Column({ name: 'subject_counts', type: 'jsonb' })
  subjectCounts: SubjectCount[];

  @Column({ name: 'difficulty_mix', type: 'jsonb' })
  difficultyMix: DifficultyCount[];

  @Column({ name: 'correct_count', type: 'int', default: 0 })
  correctCount: number;

  @Column({ name: 'incorrect_count', type: 'int', default: 0 })
  incorrectCount: number;

  @Column({ name: 'unattempted_count', type: 'int', default: 0 })
  unattemptedCount: number;

  @Column({ name: 'raw_score', type: 'int', default: 0 })
  rawScore: number;

  @Column({ name: 'max_possible_score', type: 'int' })
  maxPossibleScore: number;

  @Column({ name: 'score_percent', type: 'int', default: 0 })
  scorePercent: number;

  /** Percentile among submitted attempts on this platform; null until submitted. */
  @Column({ name: 'percentile', type: 'int', nullable: true })
  percentile: number | null;

  @Column({ name: 'subject_breakdown', type: 'jsonb', nullable: true })
  subjectBreakdown: SubjectBreakdown[] | null;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @OneToMany(() => MockTestAnswer, (answer) => answer.attempt)
  answers: MockTestAnswer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
