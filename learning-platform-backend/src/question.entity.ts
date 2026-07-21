import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QuestionPublicationStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum QuestionSource {
  CURATED = 'CURATED',
  AI_GENERATED = 'AI_GENERATED',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  question_id: string;

  @Column()
  subject: string;

  @Column()
  chapter: string;

  @Column()
  topic: string;

  @Column({ type: 'varchar', nullable: true })
  subtopic: string | null;

  @Column('text')
  question_text: string;

  // Store options as a JSON array (e.g., ["A: 10", "B: 20", "C: 30", "D: 40"])
  @Column('jsonb')
  options: string[];

  @Column()
  correct_answer: string;

  @Column('text')
  solution: string;

  // Enums for Bloom Level and Difficulty to enforce consistency
  @Column({ type: 'varchar', length: 50 })
  bloom_level: string; // "Remember", "Understand", "Apply", "Analyze", "Evaluate"

  @Column({ type: 'varchar', length: 50 })
  difficulty: string; // "Easy", "Medium", or "Hard"

  @Column('int')
  marks: number;

  @Column('int')
  estimated_time_sec: number;

  // Storing related concepts (e.g., ["electric flux", "symmetry"]) for Qdrant linking
  @Column('jsonb')
  concept_tags: string[];

  // Anticipated mistakes a student might make
  @Column('jsonb', { nullable: true })
  common_errors: string[];

  @Column({
    type: 'varchar',
    length: 20,
    default: QuestionPublicationStatus.PUBLISHED,
  })
  status: QuestionPublicationStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: QuestionSource.CURATED,
  })
  source: QuestionSource;

  @Column({ name: 'quality_score', type: 'smallint', default: 80 })
  quality_score: number;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  created_by_user_id: string | null;

  @Column({ name: 'reviewed_by_user_id', type: 'uuid', nullable: true })
  reviewed_by_user_id: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  review_notes: string | null;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  published_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
