import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('student')
  async getStudentDashboard(@CurrentUser() user: AuthenticatedUser) {
    return { data: await this.dashboardService.getStudentDashboard(user) };
  }
}
