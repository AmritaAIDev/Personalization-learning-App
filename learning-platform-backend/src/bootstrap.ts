import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  configuredAllowedOrigins,
  isAllowedBrowserOrigin,
} from './auth/origin-policy';

type CreateNestAppOptions = {
  enableShutdownHooks?: boolean;
};

export async function createNestApp(options: CreateNestAppOptions = {}) {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = configuredAllowedOrigins(
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGINS,
  );

  app.use(createPreflightCorsMiddleware(allowedOrigins));
  app.use(
    helmet({
      // Swagger UI ships inline scripts/styles; allow them while keeping the
      // rest of Helmet's hardening.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "'data:'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }
      // Do not turn an untrusted browser origin into a server error. With no
      // CORS headers the browser blocks the response, while the CSRF guard
      // separately rejects every unsafe request from that origin.
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  // Interactive API docs at /docs (and the OpenAPI spec at /docs-json).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('JEE AI Competency Engine API')
    .setDescription(
      'Secure adaptive-learning platform: diagnostics/tests, reviewed practice, ' +
        'adaptive learning, notebook, doubts. Authenticated via a session cookie ' +
        '(send the cookie set by /api/auth/login). See the backend README for the ' +
        'full endpoint reference.',
    )
    .setVersion('1.0')
    .addCookieAuth('session')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { withCredentials: true },
  });
  if (options.enableShutdownHooks ?? true) {
    app.enableShutdownHooks();
  }
  return app;
}

function createPreflightCorsMiddleware(allowedOrigins: string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const origin = request.headers.origin;
    if (isAllowedOrigin(origin, allowedOrigins) && origin) {
      response.header('Access-Control-Allow-Origin', origin);
      response.header('Access-Control-Allow-Credentials', 'true');
      response.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
      );
      response.header(
        'Access-Control-Allow-Headers',
        requestedHeaders(request) ?? 'Content-Type, Accept',
      );
      response.header('Access-Control-Max-Age', '86400');
      response.vary('Origin');
      response.vary('Access-Control-Request-Headers');
    }

    if (request.method === 'OPTIONS') {
      response.status(204).send();
      return;
    }

    next();
  };
}

function requestedHeaders(request: Request): string | undefined {
  const header = request.headers['access-control-request-headers'];
  return Array.isArray(header) ? header.join(', ') : header;
}

function isAllowedOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) return true;
  return isAllowedBrowserOrigin(origin, allowedOrigins);
}
