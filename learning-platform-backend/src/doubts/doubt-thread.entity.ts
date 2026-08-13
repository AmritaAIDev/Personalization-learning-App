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
import { Doubt } from './doubt.entity';

@Entity('doubt_threads')
@Index('IDX_doubt_threads_user_updated', ['userId', 'updatedAt'])
@Index('IDX_doubt_threads_user_scope', [
  'userId',
  'subject',
  'chapter',
  'topic',
])
export class DoubtThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 160 })
  chapter: string;

  @Column({ type: 'varchar', length: 160 })
  topic: string;

  @OneToMany(() => Doubt, (doubt) => doubt.thread)
  doubts: Doubt[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
