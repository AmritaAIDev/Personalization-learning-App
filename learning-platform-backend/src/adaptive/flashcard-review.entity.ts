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
import { Flashcard } from './flashcard.entity';
import { FlashcardRating } from './adaptive.types';

@Entity('flashcard_reviews')
@Unique('UQ_flashcard_reviews_user_card', ['userId', 'flashcardId'])
@Index('IDX_flashcard_reviews_due', ['userId', 'dueAt'])
export class FlashcardReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'flashcard_id', type: 'uuid' })
  flashcardId: string;

  @ManyToOne(() => Flashcard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flashcard_id' })
  flashcard: Flashcard;

  @Column({ name: 'last_rating', type: 'varchar', length: 10 })
  lastRating: FlashcardRating;

  @Column({ name: 'repetitions', type: 'smallint', default: 0 })
  repetitions: number;

  @Column({ name: 'interval_days', type: 'smallint', default: 0 })
  intervalDays: number;

  /** SM-2 ease factor; tightens on HARD/AGAIN, loosens on EASY. Never below 1.3. */
  @Column({ name: 'ease_factor', type: 'real', default: 2.5 })
  easeFactor: number;

  @Column({ name: 'due_at', type: 'timestamp' })
  dueAt: Date;

  @Column({ name: 'last_reviewed_at', type: 'timestamp' })
  lastReviewedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
