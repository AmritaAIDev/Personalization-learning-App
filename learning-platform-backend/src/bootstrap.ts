import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  configuredAllowedOrigins,
  isAllowedBrowserOrigin,
} from './auth/origin-policy';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

type CreateNestAppOptions = {
  enableShutdownHooks?: boolean;
};

const bootstrapLogger = new Logger('Bootstrap');

export async function createNestApp(options: CreateNestAppOptions = {}) {
  const app = await NestFactory.create(AppModule);
  // Protect against large payload DoS in multi-user serverless (Vercel 30s limit)
  app.use(json({ limit: '512kb' }));
  app.use(urlencoded({ extended: true, limit: '512kb' }));
  const allowedOrigins = configuredAllowedOrigins(
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGINS,
  );
  if (
    !process.env.FRONTEND_ORIGIN &&
    !process.env.FRONTEND_URL &&
    !process.env.CORS_ORIGINS
  ) {
    bootstrapLogger.warn(
      'None of FRONTEND_ORIGIN, FRONTEND_URL, or CORS_ORIGINS is set; ' +
        'falling back to the built-in default origins only. Browser ' +
        'requests from any other origin will be silently CORS-blocked.',
    );
  }
  bootstrapLogger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

  app.use(createPreflightCorsMiddleware(allowedOrigins));
  // Tag all API responses as non-indexable and non-cacheable (multi-user privacy)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      res.header('X-Robots-Tag', 'noindex, nofollow, noarchive');
      res.header('Cache-Control', 'no-store');
    }
    next();
  });
  const isProduction = process.env.NODE_ENV === 'production';
  const isProdSwaggerEnabled =
    isProduction && process.env.ENABLE_SWAGGER_DOCS === 'true';
  app.use(
    helmet({
      contentSecurityPolicy: isProdSwaggerEnabled
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "'data:'", "'unsafe-inline'"],
            },
          }
        : {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              connectSrc: ["'self'"],
              frameAncestors: ["'none'"],
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
  app.useGlobalFilters(new GlobalExceptionFilter());
  // Interactive API docs at /docs (and the OpenAPI spec at /docs-json).
  // Disabled in production unless ENABLE_SWAGGER_DOCS=true is set explicitly,
  // so the full API surface is not disclosed publicly by default.
  const swaggerEnabled =
    !isProduction || process.env.ENABLE_SWAGGER_DOCS === 'true';
  if (swaggerEnabled) {
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
  }
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
