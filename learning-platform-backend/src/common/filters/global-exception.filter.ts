import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Catches everything that escapes controllers/services so production never
 * relies on Express's default error handler (which is not JSON-shaped and
 * logs nothing structured). Known HttpExceptions keep their status/response;
 * anything else is logged with full detail server-side but returned to the
 * client as an opaque 500 so internals never leak.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('UnhandledException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const isHttpException = exception instanceof HttpException;
    const status: number = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttpException
      ? exception.getResponse()
      : {
          statusCode: status,
          message: 'Internal server error',
        };

    const logPayload = {
      requestId: request?.id,
      method: request?.method,
      path: request?.originalUrl ?? request?.url,
      statusCode: status,
      message:
        exception instanceof Error ? exception.message : String(exception),
    };
    const internalServerErrorStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= internalServerErrorStatus) {
      this.logger.error(
        JSON.stringify(logPayload),
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(JSON.stringify(logPayload));
    }

    response
      .status(status)
      .json(
        typeof body === 'object'
          ? { ...body, requestId: request?.id }
          : { message: body, requestId: request?.id },
      );
  }
}
