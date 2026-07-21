import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedRequest } from './auth.types';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * The API uses HttpOnly cookies, so unsafe browser requests must originate from
 * an explicitly configured frontend origin. This supplements SameSite cookies.
 */
@Injectable()
export class CsrfOriginGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const origin = request.get('origin');
    const allowedOrigins = (
      this.configService.get<string>('FRONTEND_ORIGIN') ??
      'http://localhost:3000'
    )
      .split(',')
      .map((value) => value.trim().replace(/\/$/, ''))
      .filter(Boolean);

    if (!origin || !allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      throw new ForbiddenException('Request origin is not allowed.');
    }

    return true;
  }
}
