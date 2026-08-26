import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get()
  async check() {
    return this.ready();
  }

  @Public()
  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async ready() {
    const checks: Record<string, string> = {};
    let degraded = false;

    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'unreachable';
      throw new HttpException(
        { status: 'error', ...checks, timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const qdrantUrl = this.configService.get<string>('QDRANT_URL');
    if (qdrantUrl) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${qdrantUrl.replace(/\/$/, '')}/health`, {
          signal: controller.signal,
        });
        clearTimeout(t);
        checks.qdrant = res.ok ? 'ok' : `http_${res.status}`;
        if (!res.ok) degraded = true;
      } catch {
        checks.qdrant = 'unreachable';
        degraded = true;
      }
    } else {
      checks.qdrant = 'not_configured';
    }

    const deepseekKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    checks.ai = deepseekKey ? 'configured' : 'not_configured';
    if (!deepseekKey) degraded = true;

    return {
      status: degraded ? 'degraded' : 'ok',
      ...checks,
      timestamp: new Date().toISOString(),
    };
  }
}
