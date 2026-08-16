import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
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
  BulkImportQuestionsDto,
  CreateQuestionDto,
  GenerateQuestionDraftDto,
  QuestionBankQueryDto,
  QuestionReportQueryDto,
  ReportQuestionDto,
  ResolveQuestionReportDto,
  SearchQuestionCatalogDto,
  TutorChatDto,
  UpdateQuestionDto,
  UpdateQuestionPublicationDto,
} from './questions.dto';

@ApiTags('Questions')
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

  /** Header counts for the content studio dashboard. */
  @Get('stats')
  @Roles('admin')
  async getContentStats() {
    return { data: await this.questionsService.getContentStats() };
  }

  /** Syllabus topics thinnest on published questions, for the studio's "fill this gap" flow. */
  @Get('coverage-gaps')
  @Roles('admin')
  async getCoverageGaps(
    @Query('threshold') threshold?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedThreshold = Number(threshold);
    const parsedLimit = Number(limit);
    return {
      data: await this.questionsService.getCoverageGaps(
        Number.isFinite(parsedThreshold) && parsedThreshold > 0
          ? parsedThreshold
          : undefined,
        Number.isFinite(parsedLimit) && parsedLimit > 0
          ? parsedLimit
          : undefined,
      ),
    };
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

  /**
   * Hand-typed curated question. Same draft-first rule as AI generation:
   * this never reaches students until an explicit publish.
   */
  @Roles('admin')
  @Post('bank')
  async createQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateQuestionDto,
  ) {
    return { data: await this.questionsService.createCurated(user.id, body) };
  }

  @Roles('admin')
  @Patch('bank/:questionId')
  async updateQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('questionId') questionId: string,
    @Body() body: UpdateQuestionDto,
  ) {
    return {
      data: await this.questionsService.updateQuestion(
        questionId,
        user.id,
        body,
      ),
    };
  }

  @Roles('admin')
  @Delete('bank/:questionId')
  async deleteQuestion(@Param('questionId') questionId: string) {
    await this.questionsService.deleteQuestion(questionId);
    return { data: { deleted: true } };
  }

  /** Read-only: flags published questions whose tagged difficulty doesn't match observed student performance. */
  @Roles('admin')
  @Get('calibration')
  async getDifficultyCalibration() {
    return { data: await this.questionsService.getDifficultyCalibration() };
  }

  /** Dry-run: validates every row without writing to the DB, for a bulk-import preview. */
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Roles('admin')
  @Post('bulk-import/validate')
  async validateBulkImport(@Body() body: BulkImportQuestionsDto) {
    const results = await Promise.all(
      body.rows.map((row, index) =>
        this.questionsService.validateQuestionRow(row, index + 1),
      ),
    );
    return { data: results };
  }

  /** Inserts every valid row as a DRAFT; invalid rows are reported, not fatal to the batch. */
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Roles('admin')
  @Post('bulk-import/commit')
  async commitBulkImport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: BulkImportQuestionsDto,
  ) {
    return {
      data: await this.questionsService.bulkImportQuestions(user.id, body.rows),
    };
  }

  /**
   * Student-facing: flag a question with a wrong answer key, confusing
   * wording, or a formatting issue. The one safety net for AI-pool content,
   * which is generated and served in real time and can't wait on a human
   * reviewer beforehand.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('report')
  async reportQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ReportQuestionDto,
  ) {
    return { data: await this.questionsService.reportQuestion(user.id, body) };
  }

  @Roles('admin')
  @Get('reports')
  async getReports(@Query() query: QuestionReportQueryDto) {
    return { data: await this.questionsService.findReports(query) };
  }

  @Roles('admin')
  @Patch('reports/:reportId')
  async resolveReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Body() body: ResolveQuestionReportDto,
  ) {
    return {
      data: await this.questionsService.resolveReport(reportId, user.id, body),
    };
  }
}
