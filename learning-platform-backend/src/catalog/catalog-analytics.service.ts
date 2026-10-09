import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { loadAnswerEvents } from './answer-events.query';
import {
  buildChapterAnalytics,
  buildSubjectAnalytics,
  type AnswerEvent,
} from './catalog.analytics';
import type {
  ChapterAnalytics,
  SubjectAnalytics,
} from './catalog.analytics.types';
import { findBySlug } from './catalog.slug';
import { CatalogService } from './catalog.service';

/**
 * Per-student performance analytics for a subject or a single chapter.
 * Computed on demand from the students' own graded answers; nothing is
 * stored, so the numbers cannot drift from the source tables.
 */
@Injectable()
export class CatalogAnalyticsService {
  constructor(
    private readonly catalog: CatalogService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getSubjectAnalytics(
    userId: string,
    subjectSlug: string,
    now: Date = new Date(),
  ): Promise<SubjectAnalytics> {
    const outline = await this.catalog.getSubjectOutline(subjectSlug);
    const events = await this.loadCanonicalEvents(userId, outline);
    return buildSubjectAnalytics(
      outline.subject,
      outline.chapters,
      events,
      now,
    );
  }

  async getChapterAnalytics(
    userId: string,
    subjectSlug: string,
    chapterSlug: string,
  ): Promise<ChapterAnalytics> {
    const outline = await this.catalog.getSubjectOutline(subjectSlug);
    // Accept the content-side name too (e.g. a workspace breadcrumb link).
    const aliasTarget = outline.aliases.chapterForSlug(
      outline.subject.name,
      chapterSlug,
    );
    const chapter =
      findBySlug(outline.chapters, chapterSlug) ??
      (aliasTarget ? findBySlug(outline.chapters, aliasTarget) : undefined);
    if (!chapter) throw new NotFoundException('Chapter not found.');
    const events = await this.loadCanonicalEvents(userId, outline);
    return buildChapterAnalytics(
      events.filter((event) => event.chapter === chapter.name),
    );
  }

  /**
   * The student's graded answers for the subject, with content-side chapter
   * names folded onto the tree chapters (the original name is kept as
   * `sourceChapter` so topic links still point at where the questions live).
   */
  private async loadCanonicalEvents(
    userId: string,
    outline: Awaited<ReturnType<CatalogService['getSubjectOutline']>>,
  ): Promise<AnswerEvent[]> {
    const events = await loadAnswerEvents(
      this.dataSource,
      userId,
      outline.subject.name,
      null,
    );
    return events.map((event) => ({
      ...event,
      chapter: outline.aliases.canonical(event.subject, event.chapter),
      sourceChapter: event.chapter,
    }));
  }
}
