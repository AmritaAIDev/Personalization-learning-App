import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { Topic } from './topic.entity';

@Controller('api/topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('tree')
  async getTree() {
    return this.topicsService.getTopicTree();
  }

  @Post()
  async createTopic(@Body() body: any) {
    const topic = await this.topicsService.createTopic(body);
    return { success: true, data: topic };
  }

  @Get(':id/prerequisites')
  async getPrerequisites(@Param('id') id: string) {
    const prereqs = await this.topicsService.getPrerequisites(id);
    return { success: true, data: prereqs };
  }
}
