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
      'http://localhost:3000,https://personalization-learning-app.vercel.app'
    )
      .split(',')
      .map((value) => value.trim().replace(/\/$/, ''))
      .filter(Boolean);

    if (!isAllowedOrigin(origin, allowedOrigins)) {
      throw new ForbiddenException('Request origin is not allowed.');
    }

    return true;
  }
}

function isAllowedOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) return false;
  const normalized = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(normalized)) return true;

  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === 'https:' &&
      host.endsWith('.vercel.app') &&
      (host === 'personalization-learning-app.vercel.app' ||
        host.startsWith('personalization-learning-app-') ||
        host.startsWith('personalization-learning-'))
    );
  } catch {
    return false;
  }
}
