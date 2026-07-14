import { Controller, Get, Post, Body } from '@nestjs/common';
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
  async createTopic(@Body() data: Partial<Topic>) {
    return this.topicsService.createTopic(data);
  }
}
