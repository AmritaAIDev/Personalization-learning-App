import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

/**
 * Permanent record that a student earned an achievement (see
 * achievement-definition.ts for the condition keys). Persisted rather than
 * recomputed-only so a badge stays earned even if the underlying stat is no
 * longer at (or above) its threshold when next viewed.
 */
@Entity('student_achievements')
@Unique('UQ_student_achievements_user_key', ['userId', 'achievementKey'])
@Index('IDX_student_achievements_user', ['userId'])
export class StudentAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'achievement_key', type: 'varchar', length: 40 })
  achievementKey: string;

  @CreateDateColumn({ name: 'earned_at' })
  earnedAt: Date;
}
