import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { KnowledgeTracingService } from './knowledge-tracing.service';

/**
 * Read-only, student-scoped mastery views. Recompute-on-read keeps the
 * snapshot fresh; there is nothing to write from the client.
 */
@ApiTags('Knowledge tracing')
@Controller('api/knowledge-tracing')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class KnowledgeTracingController {
  constructor(private readonly tracing: KnowledgeTracingService) {}

  /** Every tracked skill with its BKT probability, band and confidence. */
  @Get('mastery')
  async mastery(
    @CurrentUser() user: AuthenticatedUser,
    @Query('subject') subject?: string,
  ) {
    return {
      data: {
        skills: await this.tracing.masteryFor(user.id, subject),
        summary: await this.tracing.summary(user.id, subject),
      },
    };
  }

  /** The shakiest tracked skills, weakest first, for focus surfaces. */
  @Get('weak')
  async weak(
    @CurrentUser() user: AuthenticatedUser,
    @Query('subject') subject?: string,
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit?: number,
  ) {
    const safeLimit = Math.min(Math.max(limit ?? 8, 1), 25);
    return {
      data: await this.tracing.weakSkills(user.id, subject ?? null, safeLimit),
    };
  }
}
