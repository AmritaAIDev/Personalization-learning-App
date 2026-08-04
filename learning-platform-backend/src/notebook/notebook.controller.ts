import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { NotebookService } from './notebook.service';

@Controller('api/notebook')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class NotebookController {
  constructor(private readonly notebookService: NotebookService) {}

  @Get('mistakes')
  async getMistakes(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.notebookService.getMistakes(user.id),
    };
  }

  @Get('concepts')
  async getConcepts(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.notebookService.getConceptGroups(user.id),
    };
  }
}
