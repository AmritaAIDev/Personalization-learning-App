import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateDoubtDto } from './doubts.dto';
import { DoubtsService } from './doubts.service';

@ApiTags('Doubts')
@Controller('api/doubts')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class DoubtsController {
  constructor(private readonly doubtsService: DoubtsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.doubtsService.list(user.id),
    };
  }

  @Post()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDoubtDto,
  ) {
    return {
      data: await this.doubtsService.create(user.id, body),
    };
  }
}
