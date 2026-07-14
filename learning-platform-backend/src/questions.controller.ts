import { Controller, Get, Param, Query } from '@nestjs/common';
import { AgentService } from './agent/agent.service';
import { QuestionsService } from './questions.service';
import type { QuestionFilters } from './questions.service';

@Controller('api/questions')
export class QuestionsController {
  constructor(
    private readonly agentService: AgentService,
    private readonly questionsService: QuestionsService,
  ) {}

  // --- LLM path (DeepSeek): generate a fresh question on the fly ---
  @Get('generate')
  async generateQuestion(@Query('topic') topic: string) {
    const question = await this.agentService.generateDynamicQuestion(topic);
    return {
      success: true,
      data: question,
    };
  }

  // --- Question bank (PostgreSQL): pre-authored, tagged questions ---
  @Get('bank')
  async getBank(@Query() filters: QuestionFilters) {
    const data = await this.questionsService.findAll(filters);
    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Get('bank/:questionId')
  async getBankQuestion(@Param('questionId') questionId: string) {
    const data = await this.questionsService.findByQuestionId(questionId);
    return {
      success: true,
      data,
    };
  }
}
