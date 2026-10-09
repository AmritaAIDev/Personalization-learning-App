import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { UpdateChapterMetaDto } from './catalog.dto';
import { CatalogAnalyticsService } from './catalog-analytics.service';
import { CatalogService } from './catalog.service';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}$/i;

function assertSlug(value: string): string {
  if (!SLUG_PATTERN.test(value)) {
    // Same shape as an unknown slug, so probing leaks nothing extra.
    throw new NotFoundException('Not found.');
  }
  return value;
}

@ApiTags('Catalog')
@Controller('api/catalog')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly analyticsService: CatalogAnalyticsService,
  ) {}

  @Get('subjects')
  async getSubjects(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.catalogService.getSubjects(user.id) };
  }

  /** Overall and per-subject syllabus completion (the one shared definition). */
  @Get('progress')
  async getSyllabusProgress(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.catalogService.getSyllabusProgress(user.id) };
  }

  @Get('subjects/:subject/chapters')
  async getSubjectChapters(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subject') subject: string,
  ) {
    return {
      data: await this.catalogService.getSubjectChapters(
        user.id,
        assertSlug(subject),
      ),
    };
  }

  @Get('subjects/:subject/chapters/:chapter')
  async getChapterDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subject') subject: string,
    @Param('chapter') chapter: string,
  ) {
    return {
      data: await this.catalogService.getChapterDetail(
        user.id,
        assertSlug(subject),
        assertSlug(chapter),
      ),
    };
  }

  @Get('subjects/:subject/analytics')
  async getSubjectAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subject') subject: string,
  ) {
    return {
      data: await this.analyticsService.getSubjectAnalytics(
        user.id,
        assertSlug(subject),
      ),
    };
  }

  @Get('subjects/:subject/chapters/:chapter/analytics')
  async getChapterAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subject') subject: string,
    @Param('chapter') chapter: string,
  ) {
    return {
      data: await this.analyticsService.getChapterAnalytics(
        user.id,
        assertSlug(subject),
        assertSlug(chapter),
      ),
    };
  }

  @Get('admin/chapters')
  @Roles('admin')
  async listChaptersForReview() {
    return { data: await this.catalogService.listChapterMetaForReview() };
  }

  @Patch('admin/chapters/:topicId/meta')
  @Roles('admin')
  async updateChapterMeta(
    @Param('topicId', new ParseUUIDPipe()) topicId: string,
    @Body() dto: UpdateChapterMetaDto,
  ) {
    return { data: await this.catalogService.updateChapterMeta(topicId, dto) };
  }
}
