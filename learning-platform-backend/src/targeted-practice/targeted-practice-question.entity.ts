import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type TargetedPracticeReason = 'MISCONCEPTION' | 'SIMILAR';

/**
 * A single on-demand AI-generated question, requested either to remediate a
 * specific misconception (2.2) or to stay isomorphic to a source question
 * (2.3 "try a similar one"). Deliberately outside the adaptive session state
 * machine: it is answered once, standalone, and never advances a level.
 */
@Entity('targeted_practice_questions')
@Index('IDX_targeted_practice_questions_lookup', [
  'userId',
  'subject',
  'topic',
  'reason',
  'focusHash',
])
export class TargetedPracticeQuestion {
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

  @Column({ type: 'varchar', length: 20 })
  reason: TargetedPracticeReason;

  /** The misconception text, or the source question's text, that seeded generation. */
  @Column({ name: 'focus_text', type: 'text' })
  focusText: string;

  @Column({ name: 'focus_hash', type: 'varchar', length: 40 })
  focusHash: string;

  @Column({ name: 'source_question_id', type: 'uuid', nullable: true })
  sourceQuestionId: string | null;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ type: 'jsonb' })
  options: string[];

  @Column({ name: 'correct_answer', type: 'text' })
  correctAnswer: string;

  @Column({ type: 'text' })
  solution: string;

  @Column({ type: 'text' })
  hint: string;

  @Column({ name: 'concept_tags', type: 'jsonb' })
  conceptTags: string[];

  @Column({ name: 'bloom_level', type: 'varchar', length: 50 })
  bloomLevel: string;

  @Column({ type: 'varchar', length: 50 })
  difficulty: string;

  @Column({ name: 'selected_option', type: 'text', nullable: true })
  selectedOption: string | null;

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect: boolean | null;

  @Column({ name: 'answered_at', type: 'timestamp', nullable: true })
  answeredAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
