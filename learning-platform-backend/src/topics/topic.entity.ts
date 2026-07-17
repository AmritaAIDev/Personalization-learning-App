import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';

export enum TopicLevel {
  SUBJECT = 'SUBJECT',
  CHAPTER = 'CHAPTER',
  SUB_TOPIC = 'SUB_TOPIC',
  CONCEPT = 'CONCEPT',
}

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g., 'Physics', 'Electrostatics', 'Coulombs Law'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TopicLevel,
    default: TopicLevel.SUBJECT,
  })
  level: TopicLevel;

  // Self-referencing relationship for hierarchy
  @ManyToOne(() => Topic, (topic) => topic.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Topic;

  @OneToMany(() => Topic, (topic) => topic.parent)
  children: Topic[];

  // Knowledge Graph: Topics this topic depends on (e.g. Pythagoras depends on Algebra)
  @ManyToMany(() => Topic)
  @JoinTable({
    name: 'topic_prerequisites',
    joinColumn: { name: 'topic_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'prerequisite_id', referencedColumnName: 'id' },
  })
  prerequisites: Topic[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
