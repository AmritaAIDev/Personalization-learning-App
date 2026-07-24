import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

type CreateNestAppOptions = {
  enableShutdownHooks?: boolean;
};

export async function createNestApp(options: CreateNestAppOptions = {}) {
  const app = await NestFactory.create(AppModule);
  const configuredOrigins = process.env.FRONTEND_ORIGIN?.trim();
  const defaultOrigins = [
    'http://localhost:3000',
    'https://personalization-learning-app.vercel.app',
  ];
  const allowedOrigins = (configuredOrigins || defaultOrigins.join(','))
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.use(helmet());
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
      callback(new Error('Origin is not allowed by CORS.'), false);
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
  if (options.enableShutdownHooks ?? true) {
    app.enableShutdownHooks();
  }
  return app;
}

function isAllowedOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) return true;
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
