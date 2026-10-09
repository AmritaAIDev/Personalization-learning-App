import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string; // Store hashed passwords, never plain text!

  @Column({ default: 'student' })
  role: string; // e.g., 'student', 'admin'

  @Index()
  @Column({ type: 'int', default: 0 })
  xp: number; // Gamification stats surfaced on the dashboard header

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'int', default: 0 })
  streak: number; // consecutive active days

  // Personalisation (see users/personalization.ts). All optional until the
  // student completes the profile step.
  @Column({ name: 'class_name', type: 'varchar', length: 20, nullable: true })
  className: string | null; // '11' | '12' | 'Dropper'

  @Column({ type: 'varchar', length: 30, nullable: true })
  stream: string | null;

  /** Target month as YYYY-MM. */
  @Column({ name: 'target_month', type: 'char', length: 7, nullable: true })
  targetMonth: string | null;

  @Column({ name: 'daily_minutes', type: 'int', default: 120 })
  dailyMinutes: number;

  @Column({
    name: 'personalization_completed_at',
    type: 'timestamp',
    nullable: true,
  })
  personalizationCompletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
