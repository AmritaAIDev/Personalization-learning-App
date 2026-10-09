import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { loadAnswerEvents } from './answer-events.query';
import {
  buildChapterAnalytics,
  buildSubjectAnalytics,
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
    const events = await loadAnswerEvents(
      this.dataSource,
      userId,
      outline.subject.name,
      null,
    );
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
    const chapter = findBySlug(outline.chapters, chapterSlug);
    if (!chapter) throw new NotFoundException('Chapter not found.');
    const events = await loadAnswerEvents(
      this.dataSource,
      userId,
      outline.subject.name,
      chapter.name,
    );
    return buildChapterAnalytics(events);
  }
}
