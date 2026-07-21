import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  ClearDiagnosticHistoryDto,
  CreateDiagnosticDto,
  SaveDiagnosticAnswerDto,
} from './diagnostic.dto';
import { DiagnosticsService } from './diagnostics.service';

@Controller('api/diagnostics')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.diagnosticsService.getDashboard(user.id);
  }

  @Get('history')
  getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.diagnosticsService.getHistory(user.id);
  }

  @Delete('history')
  clearHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: ClearDiagnosticHistoryDto,
  ) {
    return this.diagnosticsService.clearHistory(user.id, input);
  }

  @Post()
  createAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateDiagnosticDto,
  ) {
    return this.diagnosticsService.createAttempt(user, input);
  }

  @Get(':attemptId')
  getAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.diagnosticsService.getAttempt(user.id, attemptId);
  }

  @Patch(':attemptId/answers/:questionId')
  saveAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() input: SaveDiagnosticAnswerDto,
  ) {
    return this.diagnosticsService.saveAnswer(
      user.id,
      attemptId,
      questionId,
      input,
    );
  }

  @Post(':attemptId/submit')
  submitAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.diagnosticsService.submitAttempt(user.id, attemptId);
  }

  @Get(':attemptId/analysis')
  getAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.diagnosticsService.getAnalysis(user.id, attemptId);
  }

  @Get(':attemptId/recommendations')
  getRecommendations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.diagnosticsService.getRecommendations(user.id, attemptId);
  }
}
