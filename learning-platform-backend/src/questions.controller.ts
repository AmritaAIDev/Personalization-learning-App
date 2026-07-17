import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
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
  async generateQuestion(@Query('topic') topic: string, @Query('bloomLevel') bloomLevel?: string) {
    if (!topic) {
      throw new BadRequestException('Topic is required');
    }

    try {
      const question = await this.agentService.generateDynamicQuestion(topic, bloomLevel);
      return { success: true, data: question };
    } catch (error) {
      throw error;
    }
  }

  // --- LLM path (DeepSeek): chat with the tutor ---
  @Post('chat')
  async chatWithTutor(@Body() body: { topic: string; message: string }) {
    const reply = await this.agentService.chatWithTutor(body.topic, body.message);
    return {
      success: true,
      data: { reply },
    };
  }

  // --- DUIX Auth Endpoint ---
  @Get('duix/auth')
  getDuixAuth() {
    return {
      success: true,
      data: this.agentService.getDuixAuth(),
    };
  }

  // --- DUIX Create Avatar Endpoint ---
  @Post('duix/create')
  async createDuixAvatar(@Body() body?: { conversationId?: string }) {
    // Default to the user's registered Amrita conversation ID
    const conversationId = body?.conversationId || '1967895167468535809';
    const data = await this.agentService.createDuixAvatar(conversationId);
    
    // We also need to return the token to the frontend so it can use it as `sign` in the SDK
    const token = this.agentService['configService'].get<string>('DUIX_TOKEN');
    
    return {
      success: true,
      data: {
        ...data,
        conversationId,
        token
      },
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
