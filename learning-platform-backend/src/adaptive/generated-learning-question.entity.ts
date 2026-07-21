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
import {
  GeneratedLearningQuestionStatus,
  LearningQuestionSource,
} from './adaptive.types';
import { GenerationJob } from './generation-job.entity';

/**
 * Learner-specific generated content is intentionally separate from the
 * globally published question bank. It is validated server-side and never
 * silently becomes reusable public content without editorial review.
 */
@Entity('learning_generated_questions')
@Index('IDX_learning_generated_questions_pool', [
  'userId',
  'subject',
  'chapter',
  'topic',
  'bloomLevel',
  'difficulty',
  'status',
])
export class GeneratedLearningQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'generation_job_id', type: 'uuid', nullable: true })
  generationJobId: string | null;

  @ManyToOne(() => GenerationJob, (job) => job.generatedQuestions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'generation_job_id' })
  generationJob: GenerationJob | null;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 160 })
  chapter: string;

  @Column({ type: 'varchar', length: 160 })
  topic: string;

  @Column({ name: 'bloom_level', type: 'varchar', length: 50 })
  bloomLevel: string;

  @Column({ type: 'varchar', length: 50 })
  difficulty: string;

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

  @Column({ name: 'common_errors', type: 'jsonb' })
  commonErrors: string[];

  @Column({
    type: 'varchar',
    length: 20,
    default: LearningQuestionSource.AI_POOL,
  })
  source: LearningQuestionSource;

  @Column({
    type: 'varchar',
    length: 20,
    default: GeneratedLearningQuestionStatus.READY,
  })
  status: GeneratedLearningQuestionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
