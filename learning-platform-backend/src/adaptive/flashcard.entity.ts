import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FlashcardSource, FlashcardStatus } from './adaptive.types';

@Entity('flashcards')
@Index('IDX_flashcards_scope', ['status', 'subject', 'chapter', 'topic'])
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 160 })
  chapter: string;

  @Column({ type: 'varchar', length: 160 })
  topic: string;

  @Column({ type: 'text' })
  front: string;

  @Column({ type: 'text' })
  back: string;

  @Column({ type: 'text', nullable: true })
  hint: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ type: 'varchar', length: 20, default: FlashcardSource.CURATED })
  source: FlashcardSource;

  @Column({ type: 'varchar', length: 20, default: FlashcardStatus.PUBLISHED })
  status: FlashcardStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
