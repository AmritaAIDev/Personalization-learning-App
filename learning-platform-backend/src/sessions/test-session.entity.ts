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

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
