import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { Public } from '../auth/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new HttpException(
        { status: 'error', database: 'unreachable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return {
      status: 'ok',
      database: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
