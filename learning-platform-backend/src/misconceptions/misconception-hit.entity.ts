import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export type MisconceptionSource = 'PRACTICE' | 'ADAPTIVE';

/**
 * Per-user tally of which misconception (a question's `common_errors` text)
 * a wrong answer was classified against. Keyed by a hash of the misconception
 * text rather than the text itself so repeated occurrences across different
 * questions that share the same known error still accumulate one row.
 */
@Entity('misconception_hits')
@Unique('UQ_misconception_hits_user_hash', ['userId', 'misconceptionHash'])
@Index('IDX_misconception_hits_user_topic', ['userId', 'subject', 'topic'])
export class MisconceptionHit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 160 })
  subject: string;

  @Column({ type: 'varchar', length: 200 })
  chapter: string;

  @Column({ type: 'varchar', length: 200 })
  topic: string;

  @Column({ type: 'text' })
  misconception: string;

  @Column({ name: 'misconception_hash', type: 'varchar', length: 40 })
  misconceptionHash: string;

  @Column({ name: 'hit_count', type: 'integer', default: 1 })
  hitCount: number;

  @Column({ type: 'varchar', length: 12 })
  source: MisconceptionSource;

  @Column({ name: 'last_question_id', type: 'uuid', nullable: true })
  lastQuestionId: string | null;

  @Column({ name: 'first_occurred_at', type: 'timestamp' })
  firstOccurredAt: Date;

  @Column({ name: 'last_occurred_at', type: 'timestamp' })
  lastOccurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
