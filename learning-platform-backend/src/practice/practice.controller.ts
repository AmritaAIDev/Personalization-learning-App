import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  CreatePracticeSessionDto,
  ExplainQuestionDto,
  SavePracticeAnswerDto,
} from './practice.dto';
import { PracticeService } from './practice.service';

@ApiTags('Practice')
@Controller('api/practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('sessions')
  async createOrResume(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreatePracticeSessionDto,
  ) {
    return {
      data: await this.practiceService.createOrResume(user, body),
    };
  }

  @Get('sessions/:attemptId')
  async getAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return { data: await this.practiceService.getAttempt(user.id, attemptId) };
  }

  @Put('sessions/:attemptId/answers/:questionId')
  async saveAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: SavePracticeAnswerDto,
  ) {
    return {
      data: await this.practiceService.saveAnswer(
        user.id,
        attemptId,
        questionId,
        body,
      ),
    };
  }

  @Post('sessions/:attemptId/submit')
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return {
      data: await this.practiceService.submitAttempt(user.id, attemptId),
    };
  }

  @Get('sessions/:attemptId/review')
  async getReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return {
      data: await this.practiceService.getReview(user.id, attemptId),
    };
  }

  // Synchronous model call; bounded so a review page cannot become a
  // generation firehose. A cached/fallback path keeps it responsive.
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('sessions/:attemptId/questions/:questionId/explain')
  async explainQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: ExplainQuestionDto,
  ) {
    return {
      data: await this.practiceService.explainReviewQuestion(
        user.id,
        attemptId,
        questionId,
        body,
      ),
    };
  }
}
