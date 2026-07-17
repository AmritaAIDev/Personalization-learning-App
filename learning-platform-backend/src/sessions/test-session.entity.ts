import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Topic } from '../topics/topic.entity';

@Entity('test_sessions')
export class TestSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Many sessions can belong to one user
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  // Many sessions can be about one topic
  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @Column()
  topic_id: string;

  @Column({ default: 'in-progress' })
  status: string; // 'in-progress', 'completed'

  @Column({ type: 'int', default: 0 })
  currentScore: number;

  // --- Algorithmic Routing State ---
  @Column({ type: 'int', default: 1 })
  current_taxonomy: number; // 1: Remember, 2: Understand, 3: Apply, 4: Analyze, 5: Evaluate, 6: Create

  @Column({ type: 'int', default: 1 })
  current_difficulty: number; // 1: Easy, 2: Medium, 3: Hard

  @Column({ type: 'int', default: 0 })
  streak_counter: number; // Consecutive correct answers at current node

  @Column({ type: 'int', default: 0 })
  failed_attempts: number; // Failed attempts on the current question

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
