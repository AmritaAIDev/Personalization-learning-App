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
import { LearningTopicStatus } from './adaptive.types';

@Entity('learning_topic_states')
@Unique('UQ_learning_topic_states_scope', [
  'userId',
  'subject',
  'chapter',
  'topic',
])
@Index('IDX_learning_topic_states_user_activity', ['userId', 'lastActivityAt'])
export class LearningTopicState {
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

  @Column({ name: 'current_level', type: 'smallint', default: 1 })
  currentLevel: number;

  @Column({
    type: 'varchar',
    length: 32,
    default: LearningTopicStatus.ACTIVE,
  })
  status: LearningTopicStatus;

  @Column({ name: 'streak_counter', type: 'smallint', default: 0 })
  streakCounter: number;

  @Column({ name: 'total_answered', type: 'integer', default: 0 })
  totalAnswered: number;

  @Column({ name: 'total_correct', type: 'integer', default: 0 })
  totalCorrect: number;

  @Column({
    name: 'last_activity_at',
    type: 'timestamp',
    default: () => 'now()',
  })
  lastActivityAt: Date;

  @Column({ name: 'mastered_at', type: 'timestamp', nullable: true })
  masteredAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
