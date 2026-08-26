import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuditLogMiddleware implements NestMiddleware<Request> {
  use(_req: Request, _res: Response, next: NextFunction) {
    next();
  }
}
