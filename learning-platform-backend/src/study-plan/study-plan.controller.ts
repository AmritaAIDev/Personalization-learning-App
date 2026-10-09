import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { MonthQueryDto, UpdateTaskDto, WeekQueryDto } from './study-plan.dto';
import { StudyPlanService } from './study-plan.service';

/** Every route acts on the signed-in student; there is no user id in any URL. */
@ApiTags('Study plan')
@Controller('api/study-plan')
export class StudyPlanController {
  constructor(private readonly studyPlan: StudyPlanService) {}

  @Post('generate')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async generate(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.studyPlan.generate(user.id) };
  }

  @Get('today')
  async today(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.studyPlan.getToday(user.id) };
  }

  @Get('week')
  async week(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WeekQueryDto,
  ) {
    return { data: await this.studyPlan.getWeek(user.id, query.d) };
  }

  @Get('month')
  async month(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MonthQueryDto,
  ) {
    return { data: await this.studyPlan.getMonth(user.id, query.m) };
  }

  @Patch('tasks/:taskId')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async updateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return {
      data: await this.studyPlan.updateTask(user.id, taskId, dto.action),
    };
  }
}
