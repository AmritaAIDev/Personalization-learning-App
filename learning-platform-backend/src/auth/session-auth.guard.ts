import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, SESSION_COOKIE_NAME } from './auth.service';
import { readStringCookie } from './cookie.util';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.method === 'OPTIONS') {
      return true;
    }

    const token = readStringCookie(request, SESSION_COOKIE_NAME);
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const user = await this.authService.getUserFromSessionToken(token);
    if (!user) {
      throw new UnauthorizedException(
        'Your session has expired. Please sign in again.',
      );
    }

    request.user = user;
    return true;
  }
}
