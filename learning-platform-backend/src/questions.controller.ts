import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from './auth/current-user.decorator';
import { Roles } from './auth/roles.decorator';
import type { AuthenticatedUser } from './auth/auth.types';
import { AgentService } from './agent/agent.service';
import { QuestionsService } from './questions.service';
import {
  AdminQuestionReviewQueryDto,
  GenerateQuestionDraftDto,
  QuestionBankQueryDto,
  SearchQuestionCatalogDto,
  TutorChatDto,
  UpdateQuestionPublicationDto,
} from './questions.dto';

@Controller('api/questions')
export class QuestionsController {
  constructor(
    private readonly agentService: AgentService,
    private readonly questionsService: QuestionsService,
  ) {}

  /** Reviewer inventory. This route deliberately returns draft answer keys only to admins. */
  @Get('review')
  @Roles('admin')
  async getReviewQueue(@Query() filters: AdminQuestionReviewQueryDto) {
    return { data: await this.questionsService.findAdminAll(filters) };
  }

  @Get('catalog')
  async getCatalog(@Query() query: SearchQuestionCatalogDto) {
    const data = await this.questionsService.searchCatalog(
      query.query,
      query.limit,
    );
    return { data };
  }

  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Post('chat')
  async chatWithTutor(@Body() body: TutorChatDto) {
    const reply = await this.agentService.chatWithTutor(
      body.topic,
      body.message,
    );
    return {
      success: true,
      data: { reply },
    };
  }

  @Get('bank')
  async getBank(@Query() filters: QuestionBankQueryDto) {
    const data = await this.questionsService.findPublicAll(filters);
    return {
      data,
      count: data.length,
    };
  }

  /**
   * AI-generated content enters the bank as a draft. Publishing is a separate
   * admin action so a model response can never silently reach learners.
   */
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Roles('admin')
  @Post('generate')
  async generateDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GenerateQuestionDraftDto,
  ) {
    const generated = await this.agentService.generateDynamicQuestion(
      body.topic,
      body.bloomLevel,
      body.difficulty,
    );
    const draft = await this.questionsService.createGeneratedDraft({
      createdByUserId: user.id,
      subject: body.subject,
      chapter: body.chapter,
      topic: body.topic,
      bloomLevel: body.bloomLevel,
      difficulty: body.difficulty,
      generated,
    });
    return { data: draft };
  }

  @Roles('admin')
  @Patch('bank/:questionId/publication')
  async updatePublication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('questionId') questionId: string,
    @Body() body: UpdateQuestionPublicationDto,
  ) {
    const data = await this.questionsService.updatePublication(
      questionId,
      user.id,
      body,
    );
    return { data };
  }

  @Roles('admin')
  @Get('bank/:questionId')
  async getBankQuestion(@Param('questionId') questionId: string) {
    return { data: await this.questionsService.findByQuestionId(questionId) };
  }
}
