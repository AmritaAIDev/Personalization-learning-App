import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './users/user.entity';
import { LearningQuestionSource } from './adaptive/adaptive.types';

export enum QuestionReportStatus {
  OPEN = 'OPEN',
  DISMISSED = 'DISMISSED',
  RESOLVED = 'RESOLVED',
}

export enum QuestionReportReason {
  WRONG_ANSWER = 'WRONG_ANSWER',
  CONFUSING_WORDING = 'CONFUSING_WORDING',
  TYPO_OR_FORMATTING = 'TYPO_OR_FORMATTING',
  OTHER = 'OTHER',
}

/**
 * A student's report that a specific question (curated or AI-generated) has
 * an issue. This is the safety net for content that can't be pre-reviewed by
 * a human in real time — the adaptive per-user pool in particular is
 * generated and served on demand, so review has to happen after the fact.
 */
@Entity('question_reports')
export class QuestionReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reported_by_user_id', type: 'uuid' })
  reportedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_by_user_id' })
  reportedBy: User;

  @Column({ name: 'question_source', type: 'varchar', length: 20 })
  questionSource: LearningQuestionSource;

  /** Set when questionSource is CURATED; references Question.id. */
  @Column({ name: 'question_id', type: 'uuid', nullable: true })
  questionId: string | null;

  /** Set when questionSource is AI_POOL; references GeneratedLearningQuestion.id. */
  @Column({ name: 'generated_question_id', type: 'uuid', nullable: true })
  generatedQuestionId: string | null;

  @Column({ type: 'varchar', length: 60 })
  reason: QuestionReportReason;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: QuestionReportStatus.OPEN,
  })
  status: QuestionReportStatus;

  @Column({ name: 'resolved_by_user_id', type: 'uuid', nullable: true })
  resolvedByUserId: string | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
