import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { NotebookService } from './notebook.service';
import { ReviewMistakeDto } from './dto/review-mistake.dto';
import type { NotebookMistakeSource } from './notebook.types';

const VALID_SOURCES: readonly NotebookMistakeSource[] = [
  'PRACTICE',
  'ADAPTIVE',
  'DIAGNOSTIC',
];

@ApiTags('Notebook')
@Controller('api/notebook')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class NotebookController {
  constructor(private readonly notebookService: NotebookService) {}

  @Get('mistakes')
  async getMistakes(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.notebookService.getMistakes(user.id),
    };
  }

  @Get('concepts')
  async getConcepts(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.notebookService.getConceptGroups(user.id),
    };
  }

  @Post('mistakes/:source/:questionId/review')
  async reviewMistake(
    @CurrentUser() user: AuthenticatedUser,
    @Param('source') source: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() body: ReviewMistakeDto,
  ) {
    if (!VALID_SOURCES.includes(source as NotebookMistakeSource)) {
      throw new BadRequestException(
        `source must be one of: ${VALID_SOURCES.join(', ')}`,
      );
    }
    return {
      data: await this.notebookService.reviewMistake(
        user.id,
        source as NotebookMistakeSource,
        questionId,
        body.rating,
      ),
    };
  }
}
