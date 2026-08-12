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
import { SaveMockTestAnswerDto } from './mock-test.dto';
import { MockTestsService } from './mock-tests.service';

@ApiTags('Mock tests')
@Controller('api/mock-tests')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class MockTestsController {
  constructor(private readonly mockTestsService: MockTestsService) {}

  @Get()
  async listAttempts(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.mockTestsService.listAttempts(user.id) };
  }

  @Post()
  async createAttempt(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.mockTestsService.createAttempt(user.id) };
  }

  @Get(':attemptId')
  async getAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return { data: await this.mockTestsService.getAttempt(user.id, attemptId) };
  }

  @Put(':attemptId/answers/:questionId')
  async saveAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: SaveMockTestAnswerDto,
  ) {
    await this.mockTestsService.saveAnswer(
      user.id,
      attemptId,
      questionId,
      body,
    );
    return { data: { saved: true } };
  }

  @Post(':attemptId/submit')
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return { data: await this.mockTestsService.submit(user.id, attemptId) };
  }

  @Get(':attemptId/review')
  async getReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return { data: await this.mockTestsService.getReview(user.id, attemptId) };
  }
}
