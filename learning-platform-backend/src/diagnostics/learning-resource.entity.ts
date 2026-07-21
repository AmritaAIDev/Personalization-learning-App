import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LearningResourceType } from './diagnostic.types';

/** Curated resources live in the database, never as frontend mock data. */
@Entity('learning_resources')
@Index('IDX_learning_resources_lookup', ['subject', 'topic', 'isGeneral'])
export class LearningResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 160 })
  topic: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 20 })
  resourceType: LearningResourceType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ name: 'is_general', type: 'boolean', default: false })
  isGeneral: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
