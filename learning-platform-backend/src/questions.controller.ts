import { Controller, Get, Query } from '@nestjs/common';
import { AgentService } from './agent/agent.service';

@Controller('api/questions')
export class QuestionsController {
  constructor(private readonly agentService: AgentService) {}

  @Get('generate')
  async generateQuestion(@Query('topic') topic: string) {
    console.log('Generating dynamic question for topic:', topic);
    const question = await this.agentService.generateDynamicQuestion(topic);

    return {
      success: true,
      data: question,
    };
  }
}
