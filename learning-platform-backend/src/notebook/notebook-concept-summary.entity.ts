import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Durable cache for LLM-generated concept summaries. A row is keyed per
 * (user, subject, topic); the `sourceHash` lets the service invalidate and
 * regenerate the summary when the learner makes a *new* mistake in that topic,
 * so the synthesised gap description stays current without re-calling the model
 * on every page load.
 */
@Entity('notebook_concept_summaries')
@Unique('UQ_notebook_concept_user_topic', ['userId', 'subject', 'topic'])
@Index('IDX_notebook_concept_summaries_user', ['userId'])
export class NotebookConceptSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'subject', type: 'varchar', length: 160 })
  subject: string;

  @Column({ name: 'chapter', type: 'varchar', length: 200 })
  chapter: string;

  @Column({ name: 'topic', type: 'varchar', length: 200 })
  topic: string;

  @Column({ name: 'concept_label', type: 'varchar', length: 240 })
  conceptLabel: string;

  @Column({ name: 'misconception_summary', type: 'text' })
  misconceptionSummary: string;

  @Column({ name: 'source_hash', type: 'varchar', length: 64 })
  sourceHash: string;

  @Column({
    name: 'summary_source',
    type: 'varchar',
    length: 12,
    default: 'FALLBACK',
  })
  summarySource: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
