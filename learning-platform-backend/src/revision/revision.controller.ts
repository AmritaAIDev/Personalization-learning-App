import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RevisionService } from './revision.service';

@ApiTags('Revision')
@Controller('api/revision')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class RevisionController {
  constructor(private readonly revisionService: RevisionService) {}

  @Get('hub')
  async getHub(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.revisionService.getHub(user.id),
    };
  }
}
