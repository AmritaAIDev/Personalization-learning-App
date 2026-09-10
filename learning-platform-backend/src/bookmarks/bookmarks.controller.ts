import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { BookmarksService } from './bookmarks.service';

@ApiTags('Bookmarks')
@Controller('api/bookmarks')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  async getBookmarks(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.bookmarksService.getBookmarks(user.id),
    };
  }

  @Get('ids')
  async getBookmarkedIds(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.bookmarksService.getBookmarkedIds(user.id),
    };
  }

  @Post(':questionId/toggle')
  async toggle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return {
      data: await this.bookmarksService.toggle(user.id, questionId),
    };
  }
}
