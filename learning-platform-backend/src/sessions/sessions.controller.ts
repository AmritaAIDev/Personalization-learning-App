import { Controller, Get, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('api/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('journey/:userId')
  async getJourney(@Param('userId') userId: string) {
    return this.sessionsService.getJourneyForUser(userId);
  }
}
