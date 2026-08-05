import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@Controller('api/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('journey')
  async getJourney(@CurrentUser() user: AuthenticatedUser) {
    return this.sessionsService.getJourneyForUser(user.id);
  }
}
