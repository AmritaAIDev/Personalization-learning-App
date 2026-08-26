import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { json, urlencoded } from 'express';
import { Request, Response, NextFunction } from 'express';
import { ApiErrorFilter } from './common/filters/api-error.filter';
import * as crypto from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // --- Sentry initialization (structured logging, tracing, metrics) ---
  SentryModule.init({
    dsn: configService.get<string>('SENTRY_DSN'),
    environment: configService.get<string>('NODE_ENV'),
    tracesSampleRate:
      configService.get<number>('SENTRY_TRACES_SAMPLE_RATE') || 0.2,
    attachPid: true,
    attachRequest: true,
    beforeSend: (event) => {
      event.request = event.request || {};
      if (event.request.queryString) {
        event.request.queryString = event.request.queryString.replace(
          /[&?](token|key|secret)=[^&]*/gi,
          '$1=***REDACTED***',
        );
      }
      return event;
    },
  });

  // --- Global middlewares (order matters) ---
  app.use(compression({ level: 9 }));
  app.use(helmet());

  // Large payload protection
  app.use(json({ limit: '512kb' }));
  app.use(urlencoded({ extended: true, limit: '512kb' }));

  // --- Structured request logging middleware ---
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logger = new Logger('HTTP');
      logger.log({
        level: 'info',
        message: `${req.method} ${req.path} ${res.statusCode}`,
        responseTimeMs: duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        correlationId: req.headers['x-correlation-id'] || undefined,
      });
    });
    next();
  });

  // --- Rate limiting per IP ---
  const rateLimit = require('express-rate-limit');
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', globalLimiter);

  // --- Payload size guard ---
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.headers['content-length'] &&
      parseInt(req.headers['content-length']) > 512 * 1024
    ) {
      res.status(413).json({ error: 'Payload too large, max 512KB.' });
    } else {
      next();
    }
  });

  // --- Request ID generator ---
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-correlation-id'] =
      req.headers['x-correlation-id'] || crypto.randomUUID();
    next();
  });

  // --- Global validation pipe ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // --- Global exception filter (structured errors, Sentry capture) ---
  app.useGlobalFilters(new ApiErrorFilter());

  // --- Versioning ---
  app.setGlobalPrefix('api', {
    bodyParser: false,
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1', '2'],
  });

  // --- Health endpoints (already in HealthController) ---
  // No extra setup needed; /health, /health/live, /health/ready

  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);
  new Logger('Bootstrap').log(`🚀 Server running on http://localhost:${port}`);
}

bootstrap();
