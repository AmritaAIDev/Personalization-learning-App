import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  GenerateTargetedQuestionDto,
  SubmitTargetedAnswerDto,
} from './targeted-practice.dto';
import { TargetedPracticeService } from './targeted-practice.service';

@ApiTags('Targeted practice')
@Controller('api/targeted-practice')
@Throttle({ default: { limit: 12, ttl: 60_000 } })
export class TargetedPracticeController {
  constructor(private readonly service: TargetedPracticeService) {}

  @Post('questions')
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: GenerateTargetedQuestionDto,
  ) {
    return { data: await this.service.generate(user.id, input) };
  }

  @Post('questions/:id/answer')
  async submitAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: SubmitTargetedAnswerDto,
  ) {
    return {
      data: await this.service.submitAnswer(user.id, id, input.selectedOption),
    };
  }
}
