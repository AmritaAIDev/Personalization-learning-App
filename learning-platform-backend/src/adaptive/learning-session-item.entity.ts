import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from '../question.entity';
import { LearningAnswer } from './learning-answer.entity';
import { LearningQuestionSource } from './adaptive.types';
import { GeneratedLearningQuestion } from './generated-learning-question.entity';
import { LearningSession } from './learning-session.entity';

@Entity('learning_session_items')
@Unique('UQ_learning_session_item_sequence', ['sessionId', 'sequence'])
export class LearningSessionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => LearningSession, (session) => session.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: LearningSession;

  @Column({ type: 'smallint' })
  sequence: number;

  @Column({ type: 'varchar', length: 20 })
  source: LearningQuestionSource;

  @Column({ name: 'question_id', type: 'uuid', nullable: true })
  questionId: string | null;

  @ManyToOne(() => Question, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question: Question | null;

  @Column({ name: 'generated_question_id', type: 'uuid', nullable: true })
  generatedQuestionId: string | null;

  @ManyToOne(() => GeneratedLearningQuestion, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'generated_question_id' })
  generatedQuestion: GeneratedLearningQuestion | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @OneToMany(() => LearningAnswer, (answer) => answer.sessionItem)
  answers: LearningAnswer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
