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
import { DiagnosticAttempt } from './diagnostic-attempt.entity';

@Entity('diagnostic_answers')
@Unique('UQ_diagnostic_answers_attempt_question', ['attemptId', 'questionId'])
@Index('IDX_diagnostic_answers_attempt', ['attemptId'])
export class DiagnosticAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DiagnosticAttempt, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attempt_id' })
  attempt: DiagnosticAttempt;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
