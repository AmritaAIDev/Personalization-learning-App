import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

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

  @Column({ nullable: true })
  subtopic: string;

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
  difficulty: string; // "Easy", "Medium", "Hard", "Very Hard"

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

  @CreateDateColumn()
  created_at: Date;
}
