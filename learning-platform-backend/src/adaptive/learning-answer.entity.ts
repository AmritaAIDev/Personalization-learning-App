import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { LearningSessionItem } from './learning-session-item.entity';

@Entity('learning_answers')
@Unique('UQ_learning_answers_item_attempt', ['sessionItemId', 'attemptNumber'])
export class LearningAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_item_id', type: 'uuid' })
  sessionItemId: string;

  @ManyToOne(() => LearningSessionItem, (item) => item.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_item_id' })
  sessionItem: LearningSessionItem;

  @Column({ name: 'attempt_number', type: 'smallint' })
  attemptNumber: number;

  @Column({ name: 'selected_option', type: 'text' })
  selectedOption: string;

  @Column({ name: 'is_correct', type: 'boolean' })
  isCorrect: boolean;

  @Column({ name: 'elapsed_seconds', type: 'integer', nullable: true })
  elapsedSeconds: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
