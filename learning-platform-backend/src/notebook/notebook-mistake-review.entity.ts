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
import { User } from '../users/user.entity';
import { FlashcardRating } from '../adaptive/adaptive.types';
import type { NotebookMistakeSource } from './notebook.types';

/**
 * Real spaced-repetition schedule for a Notebook mistake, mirroring
 * FlashcardReview's FSRS memory state (see ../adaptive/fsrs.util.ts and
 * flashcard-review.entity.ts) but keyed by (userId, source, questionId)
 * rather than a single flashcardId. Mistakes span three heterogeneous
 * source tables (PracticeAnswer/LearningAnswer/DiagnosticAnswer, see
 * notebook.service.ts's dedupeLatest()), so questionId is not a real FK.
 * The scheduling math here is intentionally a separate, duplicated copy
 * (not shared with adaptive.service.ts) to keep Flashcards' existing,
 * working behavior completely unaffected.
 */
@Entity('notebook_mistake_reviews')
@Unique('UQ_notebook_mistake_reviews_user_source_question', [
  'userId',
  'source',
  'questionId',
])
@Index('IDX_notebook_mistake_reviews_due', ['userId', 'dueAt'])
export class NotebookMistakeReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'source', type: 'varchar', length: 12 })
  source: NotebookMistakeSource;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'last_rating', type: 'varchar', length: 10 })
  lastRating: FlashcardRating;

  @Column({ name: 'repetitions', type: 'smallint', default: 0 })
  repetitions: number;

  @Column({ name: 'interval_days', type: 'smallint', default: 0 })
  intervalDays: number;

  /** FSRS memory state (D in [1,10], S in days) — see fsrs.util.ts. */
  @Column({ name: 'difficulty', type: 'real', default: 5 })
  difficulty: number;

  @Column({ name: 'stability', type: 'real', default: 1 })
  stability: number;

  @Column({ name: 'due_at', type: 'timestamp' })
  dueAt: Date;

  @Column({ name: 'last_reviewed_at', type: 'timestamp' })
  lastReviewedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
