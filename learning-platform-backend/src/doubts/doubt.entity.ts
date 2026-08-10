import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { DoubtThread } from './doubt-thread.entity';

export enum DoubtStatus {
  OPEN = 'OPEN',
  ANSWERED = 'ANSWERED',
}

@Entity('doubts')
@Index('IDX_doubts_user_created', ['userId', 'createdAt'])
@Index('IDX_doubts_user_scope', ['userId', 'subject', 'chapter', 'topic'])
export class Doubt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => DoubtThread, (thread) => thread.doubts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'thread_id' })
  thread: DoubtThread | null;

  @Column({ name: 'thread_id', type: 'uuid', nullable: true })
  threadId: string | null;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 160 })
  chapter: string;

  @Column({ type: 'varchar', length: 160 })
  topic: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'question_id', type: 'uuid', nullable: true })
  questionId: string | null;

  @Column({ name: 'learning_session_id', type: 'uuid', nullable: true })
  learningSessionId: string | null;

  @Column({ name: 'learning_session_item_id', type: 'uuid', nullable: true })
  learningSessionItemId: string | null;

  @Column({ name: 'practice_attempt_id', type: 'uuid', nullable: true })
  practiceAttemptId: string | null;

  @Column({
    name: 'notebook_card_id',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  notebookCardId: string | null;

  @Column({ name: 'assistant_response', type: 'text', nullable: true })
  assistantResponse: string | null;

  /**
   * Reviewed concept notes (title/topic/chapter) the answer was grounded on.
   * Null for doubts answered before RAG citations, or when the vector store had
   * nothing to cite.
   */
  @Column({ name: 'sources', type: 'jsonb', nullable: true })
  sources: Array<{ title: string; topic: string; chapter: string }> | null;

  @Column({ type: 'varchar', length: 20, default: DoubtStatus.OPEN })
  status: DoubtStatus;

  @Column({ name: 'answered_at', type: 'timestamp', nullable: true })
  answeredAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
