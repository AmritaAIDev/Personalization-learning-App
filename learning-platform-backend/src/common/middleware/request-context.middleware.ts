import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Stamps every request with a correlation id (echoed as X-Request-Id and
 * attached to req.id for the exception filter to reuse) and logs one
 * structured JSON line per request on completion. This is the app's only
 * request-level log today; it exists so production incidents can be traced
 * by request id instead of grepping unstructured console output.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(
    request: Request & { id?: string },
    response: Response,
    next: NextFunction,
  ) {
    const requestId =
      request.headers['x-request-id']?.toString() ?? randomUUID();
    request.id = requestId;
    response.setHeader('X-Request-Id', requestId);

    const start = process.hrtime.bigint();
    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      this.logger.log(
        JSON.stringify({
          requestId,
          method: request.method,
          path: request.originalUrl ?? request.url,
          statusCode: response.statusCode,
          durationMs: Math.round(durationMs),
        }),
      );
    });

    next();
  }
}
