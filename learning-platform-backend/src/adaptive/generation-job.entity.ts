import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { GeneratedLearningQuestion } from './generated-learning-question.entity';
import { GenerationJobStatus } from './adaptive.types';

@Entity('learning_generation_jobs')
@Index('IDX_learning_generation_jobs_queue', ['status', 'runAfter'])
@Index('IDX_learning_generation_jobs_scope', [
  'userId',
  'subject',
  'chapter',
  'topic',
  'targetLevel',
])
export class GenerationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 160 })
  chapter: string;

  @Column({ type: 'varchar', length: 160 })
  topic: string;

  @Column({ name: 'target_level', type: 'smallint' })
  targetLevel: number;

  @Column({ name: 'bloom_level', type: 'varchar', length: 50 })
  bloomLevel: string;

  @Column({ type: 'varchar', length: 50 })
  difficulty: string;

  @Column({ name: 'requested_count', type: 'smallint' })
  requestedCount: number;

  @Column({ name: 'generated_count', type: 'smallint', default: 0 })
  generatedCount: number;

  @Column({ type: 'varchar', length: 20, default: GenerationJobStatus.PENDING })
  status: GenerationJobStatus;

  @Column({ name: 'attempt_count', type: 'smallint', default: 0 })
  attemptCount: number;

  @Column({ name: 'last_error', type: 'varchar', length: 500, nullable: true })
  lastError: string | null;

  @Column({ name: 'run_after', type: 'timestamp', default: () => 'now()' })
  runAfter: Date;

  @Column({ name: 'locked_at', type: 'timestamp', nullable: true })
  lockedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(
    () => GeneratedLearningQuestion,
    (question) => question.generationJob,
  )
  generatedQuestions: GeneratedLearningQuestion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
