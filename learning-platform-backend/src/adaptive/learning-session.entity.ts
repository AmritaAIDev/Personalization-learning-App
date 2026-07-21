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
import {
  LearningSessionStatus,
  LearningSessionTransition,
} from './adaptive.types';
import { LearningSessionItem } from './learning-session-item.entity';
import { LearningTopicState } from './learning-topic-state.entity';

@Entity('learning_sessions')
@Index('IDX_learning_sessions_user_status', ['userId', 'status'])
@Index('IDX_learning_sessions_state_status', ['stateId', 'status'])
export class LearningSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'state_id', type: 'uuid' })
  stateId: string;

  @ManyToOne(() => LearningTopicState, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'state_id' })
  state: LearningTopicState;

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

  @Column({ type: 'smallint' })
  level: number;

  @Column({ name: 'bloom_level', type: 'varchar', length: 50 })
  bloomLevel: string;

  @Column({ type: 'varchar', length: 50 })
  difficulty: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: LearningSessionStatus.ACTIVE,
  })
  status: LearningSessionStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: LearningSessionTransition.NONE,
  })
  transition: LearningSessionTransition;

  @Column({ name: 'total_questions', type: 'smallint', default: 5 })
  totalQuestions: number;

  @Column({ name: 'current_sequence', type: 'smallint', default: 1 })
  currentSequence: number;

  @OneToMany(() => LearningSessionItem, (item) => item.session)
  items: LearningSessionItem[];

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
