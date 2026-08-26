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

  @Column({ type: 'simple-array', default: [], select: false })
  @Index()
  concurrentSessions: string[]; // active session token hashes for this user (for logout-all)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
