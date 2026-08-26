import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

export interface UserSession {
  id: string;
  roles: string[];
  concurrentSessions: string[];
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserSession | undefined;

    if (!user) {
      return false;
    }

    const currentToken =
      request.headers['x-token'] || request.cookies?.session || '';
    const isCurrentSessionActive = user.concurrentSessions.includes(
      currentToken as string,
    );

    if (isCurrentSessionActive) {
      return true;
    }

    if (user.concurrentSessions.length < 3) {
      user.concurrentSessions = [
        ...user.concurrentSessions,
        currentToken as string,
      ];
      return true;
    }

    return false;
  }
}
