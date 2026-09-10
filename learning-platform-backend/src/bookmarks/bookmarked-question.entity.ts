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
import { Question } from '../question.entity';

/**
 * A student's "save this question for later" bookmark, keyed directly by
 * (userId, questionId) — no source/context column. Unlike Notebook's
 * mistake cards (which span three structurally different answer tables),
 * a bookmark only ever targets the shared `questions` table: practice,
 * diagnostic and mock-test attempts all reference `questions.id` for their
 * answers (verified in practice-answer.entity.ts / diagnostic-answer.entity.ts
 * / mock-test-answer.entity.ts), so the same question bookmarked from any of
 * those contexts is genuinely the same row here, not three.
 *
 * Adaptive (AI-generated) questions are deliberately out of scope: LearningAnswer
 * references a session item / generated-question pair, not `questions.id`, so
 * they don't fit this table without a separate, differently-shaped path.
 */
@Entity('bookmarked_questions')
@Unique('UQ_bookmarked_questions_user_question', ['userId', 'questionId'])
@Index('IDX_bookmarked_questions_user', ['userId'])
export class BookmarkedQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
