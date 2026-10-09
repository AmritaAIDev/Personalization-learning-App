import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Topic } from '../topics/topic.entity';

export enum ChapterDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

/** Where a metadata row's text came from, for review and re-seeding. */
export enum ChapterMetaSource {
  COMPASS_IMPORT = 'COMPASS_IMPORT',
  AI_DRAFT = 'AI_DRAFT',
  ADMIN = 'ADMIN',
}

/** Only PUBLISHED rows are ever shown to students. */
export enum ChapterMetaStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

/**
 * Study-guide metadata for one CHAPTER-level topic: the overview, learning
 * objectives and key formulas that the chapter page shows, plus the `unit`
 * (e.g. "Mechanics", "Organic") used to group chapters on the subject page.
 *
 * Counts that can go stale (questions, sub-topics, student progress) are
 * deliberately not stored here; they are computed from live tables.
 * A row may exist with only a `unit` (no overview yet) and status DRAFT.
 */
@Entity('chapter_meta')
@Index('IDX_chapter_meta_status', ['status'])
export class ChapterMeta {
  @PrimaryColumn({ name: 'topic_id', type: 'uuid' })
  topicId: string;

  @OneToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @Column({ type: 'varchar', length: 60, nullable: true })
  unit: string | null;

  @Column({ type: 'text', nullable: true })
  overview: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  objectives: string[];

  /** LaTeX or plain-text formulas, rendered with the app's KaTeX pipeline. */
  @Column({ name: 'key_formulas', type: 'jsonb', default: () => "'[]'" })
  keyFormulas: string[];

  @Column({
    type: 'enum',
    enum: ChapterDifficulty,
    nullable: true,
  })
  difficulty: ChapterDifficulty | null;

  @Column({ name: 'study_minutes', type: 'int', nullable: true })
  studyMinutes: number | null;

  /** Admin-entered note on JEE weightage; intentionally never auto-filled. */
  @Column({
    name: 'jee_weightage_note',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  jeeWeightageNote: string | null;

  @Column({
    type: 'enum',
    enum: ChapterMetaSource,
    default: ChapterMetaSource.AI_DRAFT,
  })
  source: ChapterMetaSource;

  @Column({
    type: 'enum',
    enum: ChapterMetaStatus,
    default: ChapterMetaStatus.DRAFT,
  })
  status: ChapterMetaStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
