import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from '../question.entity';
import { PracticeAttempt } from './practice-attempt.entity';

@Entity('practice_answers')
@Unique('UQ_practice_answers_attempt_question', ['attemptId', 'questionId'])
@Index('IDX_practice_answers_attempt', ['attemptId'])
export class PracticeAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PracticeAttempt, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attempt_id' })
  attempt: PracticeAttempt;

  @Column({ name: 'attempt_id', type: 'uuid' })
  attemptId: string;

  @ManyToOne(() => Question, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'selected_option', type: 'text', nullable: true })
  selectedOption: string | null;

  @Column({ name: 'elapsed_seconds', type: 'int', nullable: true })
  elapsedSeconds: number | null;

  /**
   * Optional pre-answer self-rated confidence (1 = unsure, 3 = certain). Drives
   * calibration feedback on review; nullable so it never blocks answering.
   */
  @Column({ name: 'confidence', type: 'smallint', nullable: true })
  confidence: number | null;

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect: boolean | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
