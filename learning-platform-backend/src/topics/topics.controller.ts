import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { CreateTopicDto } from './create-topic.dto';
import { TopicsService } from './topics.service';

@ApiTags('Topics')
@Controller('api/topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('tree')
  async getTree() {
    return this.topicsService.getTopicTree();
  }

  @Roles('admin')
  @Post()
  async createTopic(@Body() body: CreateTopicDto) {
    const topic = await this.topicsService.createTopic({
      name: body.name.trim(),
      description: body.description?.trim(),
      level: body.level,
    });
    return { success: true, data: topic };
  }

  @Get(':id/prerequisites')
  async getPrerequisites(@Param('id', ParseUUIDPipe) id: string) {
    const prereqs = await this.topicsService.getPrerequisites(id);
    return { success: true, data: prereqs };
  }
}
