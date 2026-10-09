import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/**
 * One row per learner × skill (subject / chapter / topic) holding the BKT
 * probability that the skill is learned. A derived, recomputable snapshot —
 * never a source of truth: it is rebuilt from the graded answer events, so
 * it can be truncated and regenerated at any time (see README).
 */
@Entity('skill_mastery')
@Unique('UQ_skill_mastery_user_skill', [
  'userId',
  'subject',
  'chapter',
  'topic',
])
@Index('IDX_skill_mastery_user_pknow', ['userId', 'pKnow'])
export class SkillMastery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 160 })
  chapter: string;

  @Column({ type: 'varchar', length: 160 })
  topic: string;

  /** P(learned) from the BKT trace, 0..1. numeric(4,3) keeps it exact. */
  @Column({
    name: 'p_know',
    type: 'numeric',
    precision: 4,
    scale: 3,
    default: 0,
  })
  pKnow: number;

  /** Graded observations folded into the current estimate (capped). */
  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 0 })
  correct: number;

  @Column({ name: 'last_traced_at', type: 'timestamp', nullable: true })
  lastTracedAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
