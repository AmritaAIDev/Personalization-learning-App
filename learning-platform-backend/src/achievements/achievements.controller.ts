import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AchievementsService } from './achievements.service';

@ApiTags('Achievements')
@Controller('api/achievements')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getAchievements(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.achievementsService.getAchievements(user),
    };
  }
}
