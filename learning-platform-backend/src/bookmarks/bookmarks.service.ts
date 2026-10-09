import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../question.entity';
import { BookmarkedQuestion } from './bookmarked-question.entity';

export interface BookmarkedQuestionView {
  questionId: string;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  solution: string;
  difficulty: string;
  bloomLevel: string;
  conceptTags: string[];
  bookmarkedAt: string;
}

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(BookmarkedQuestion)
    private readonly bookmarks: Repository<BookmarkedQuestion>,
    @InjectRepository(Question)
    private readonly questions: Repository<Question>,
  ) {}

  /** Returns the current bookmark state after toggling. */
  async toggle(
    userId: string,
    questionId: string,
  ): Promise<{ bookmarked: boolean }> {
    const existing = await this.bookmarks.findOne({
      where: { userId, questionId },
    });
    if (existing) {
      await this.bookmarks.delete({ id: existing.id });
      return { bookmarked: false };
    }

    const question = await this.questions.findOne({
      where: { id: questionId },
      select: { id: true },
    });
    if (!question) {
      throw new NotFoundException('Question not found.');
    }

    await this.bookmarks.save(this.bookmarks.create({ userId, questionId }));
    return { bookmarked: true };
  }

  /** Lightweight id set for hydrating toggle buttons across a review list. */
  async getBookmarkedIds(userId: string): Promise<string[]> {
    const rows = await this.bookmarks.find({
      where: { userId },
      select: { questionId: true },
    });
    return rows.map((row) => row.questionId);
  }

  async getBookmarks(userId: string): Promise<BookmarkedQuestionView[]> {
    const rows = await this.bookmarks.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: { question: true },
    });
    return rows
      .filter((row) => row.question)
      .map((row) => ({
        questionId: row.question.id,
        subject: row.question.subject,
        chapter: row.question.chapter,
        topic: row.question.topic,
        questionText: row.question.question_text,
        options: row.question.options,
        correctAnswer: row.question.correct_answer,
        solution: row.question.solution,
        difficulty: row.question.difficulty,
        bloomLevel: row.question.bloom_level,
        conceptTags: row.question.concept_tags,
        bookmarkedAt: row.createdAt.toISOString(),
      }));
  }
}
