import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  AskTutorDto,
  CreateLearningSessionDto,
  FlashcardQueryDto,
  GenerateFlashcardsDto,
  ReviewFlashcardDto,
  SubmitLearningAnswerDto,
} from './adaptive.dto';
import { AdaptiveService } from './adaptive.service';
import { CompetencyService } from './competency.service';

@ApiTags('Adaptive learning')
@Controller('api/learning')
export class AdaptiveController {
  constructor(
    private readonly adaptiveService: AdaptiveService,
    private readonly competencyService: CompetencyService,
  ) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.adaptiveService.getDashboard(user.id) };
  }

  @Get('growth')
  async getGrowth(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.competencyService.getGrowth(user.id) };
  }

  @Get('subtopics')
  async getSubtopics(@Query() query: CreateLearningSessionDto) {
    return { data: await this.adaptiveService.getConceptBreakdown(query) };
  }

  @Get('coverage')
  async getQuestionCoverage(@Query() query: CreateLearningSessionDto) {
    return { data: await this.adaptiveService.getQuestionCoverage(query) };
  }

  @Get('placement')
  async getPlacement(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CreateLearningSessionDto,
  ) {
    return { data: await this.adaptiveService.getPlacement(user.id, query) };
  }

  @Get('flashcards')
  async getFlashcards(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FlashcardQueryDto,
  ) {
    return { data: await this.adaptiveService.getFlashcards(user.id, query) };
  }

  // A cached pool answers most batches instantly, so a recall run can request
  // several batches per minute without hitting the AI generation path.
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Post('flashcards/generate')
  async generateFlashcards(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GenerateFlashcardsDto,
  ) {
    return {
      data: await this.adaptiveService.generateFlashcards(user.id, body),
    };
  }

  @Post('flashcards/:flashcardId/review')
  async reviewFlashcard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('flashcardId', ParseUUIDPipe) flashcardId: string,
    @Body() body: ReviewFlashcardDto,
  ) {
    return {
      data: await this.adaptiveService.reviewFlashcard(
        user.id,
        flashcardId,
        body,
      ),
    };
  }

  @Post('sessions')
  async createOrResume(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateLearningSessionDto,
  ) {
    return { data: await this.adaptiveService.createOrResume(user, body) };
  }

  @Get('sessions/:sessionId')
  async getSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return { data: await this.adaptiveService.getSession(user.id, sessionId) };
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('sessions/:sessionId/items/:sessionItemId/answer')
  async submitAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('sessionItemId', ParseUUIDPipe) sessionItemId: string,
    @Body() body: SubmitLearningAnswerDto,
  ) {
    return {
      data: await this.adaptiveService.submitAnswer(
        user.id,
        sessionId,
        sessionItemId,
        body,
      ),
    };
  }

  @Get('sessions/:sessionId/tutor')
  async getTutorConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return {
      data: await this.adaptiveService.getTutorConversation(user.id, sessionId),
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('sessions/:sessionId/tutor')
  async askTutor(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: AskTutorDto,
  ) {
    return {
      data: await this.adaptiveService.askTutor(user.id, sessionId, body),
    };
  }

  /**
   * Server-Sent Events variant of {@link askTutor}: emits `chunk` events as
   * the model generates text, then one `done` event carrying the persisted
   * message (same shape the non-streaming endpoint returns), or one `error`
   * event if generation fails before producing anything. A POST body (not
   * native EventSource) is required here, so the frontend reads this with a
   * plain `fetch` + stream reader rather than the `EventSource` API.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('sessions/:sessionId/tutor/stream')
  async askTutorStream(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: AskTutorDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const stream = await this.adaptiveService.askTutorStream(
        user.id,
        sessionId,
        body,
      );
      const iterator = stream[Symbol.asyncIterator]();
      let step = await iterator.next();
      while (!step.done) {
        send('chunk', { content: step.value });
        step = await iterator.next();
      }
      send('done', { message: step.value });
    } catch (error) {
      send('error', {
        message:
          error instanceof Error
            ? error.message
            : 'The AI tutor is currently unavailable.',
      });
    } finally {
      res.end();
    }
  }
}
