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
import { PracticeAnswer } from './practice-answer.entity';
import {
  PracticeAnalysis,
  PracticeAttemptStatus,
} from './practice.types';

@Entity('practice_attempts')
@Index('IDX_practice_attempts_user_status', ['userId', 'status'])
@Index('IDX_practice_attempts_scope', ['userId', 'subject', 'chapter', 'topic'])
export class PracticeAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 160 })
  chapter: string;

  @Column({ type: 'varchar', length: 160 })
  topic: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'question_ids', type: 'jsonb' })
  questionIds: string[];

  @Column({
    type: 'varchar',
    length: 20,
    default: PracticeAttemptStatus.IN_PROGRESS,
  })
  status: PracticeAttemptStatus;

  @Column({ name: 'total_questions', type: 'int' })
  totalQuestions: number;

  @Column({ name: 'correct_count', type: 'int', default: 0 })
  correctCount: number;

  @Column({ name: 'score_percent', type: 'int', default: 0 })
  scorePercent: number;

  @Column({ type: 'jsonb', nullable: true })
  analysis: PracticeAnalysis | null;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @OneToMany(() => PracticeAnswer, (answer) => answer.attempt)
  answers: PracticeAnswer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
