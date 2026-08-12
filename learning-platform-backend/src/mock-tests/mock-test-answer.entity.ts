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
import { MockTestAttempt } from './mock-test-attempt.entity';

@Entity('mock_test_answers')
@Unique('UQ_mock_test_answers_attempt_question', ['attemptId', 'questionId'])
@Index('IDX_mock_test_answers_attempt', ['attemptId'])
export class MockTestAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MockTestAttempt, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attempt_id' })
  attempt: MockTestAttempt;

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

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect: boolean | null;

  @Column({ name: 'marks_awarded', type: 'int', nullable: true })
  marksAwarded: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
